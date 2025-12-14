import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Helper function to check user's role in workspace
async function getUserWorkspaceRole(userId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });
  return member?.role || null;
}

// GET /api/workspaces/[id]/members - Get all members
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is member of workspace
    const userRole = await getUserWorkspaceRole(user.id, id);
    if (!userRole) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/members - Add a member directly (for existing users)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, role = "MEMBER" } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if current user is OWNER or ADMIN
    const currentUserRole = await getUserWorkspaceRole(currentUser.id, id);
    if (!currentUserRole || currentUserRole === "MEMBER") {
      return NextResponse.json(
        { message: "Only owners and admins can add members" },
        { status: 403 }
      );
    }

    // Validate role
    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role. Must be ADMIN or MEMBER" },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { message: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // Add member
    const member = await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Remove any pending invite for this user
    await prisma.workspaceInvite.deleteMany({
      where: {
        email: targetUser.email!,
        workspaceId: id,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/members - Remove a member
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { message: "Member ID is required" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get the member to be removed
    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.workspaceId !== id) {
      return NextResponse.json(
        { message: "Member not found in this workspace" },
        { status: 404 }
      );
    }

    // Check permissions
    const currentUserRole = await getUserWorkspaceRole(currentUser.id, id);

    // Users can remove themselves
    if (memberToRemove.userId === currentUser.id) {
      // Owner cannot leave their own workspace
      if (memberToRemove.role === "OWNER") {
        return NextResponse.json(
          { message: "Owner cannot leave the workspace. Transfer ownership first." },
          { status: 400 }
        );
      }
    } else {
      // Only OWNER and ADMIN can remove others
      if (!currentUserRole || currentUserRole === "MEMBER") {
        return NextResponse.json(
          { message: "Only owners and admins can remove members" },
          { status: 403 }
        );
      }

      // ADMIN cannot remove OWNER or other ADMINs
      if (currentUserRole === "ADMIN" && ["OWNER", "ADMIN"].includes(memberToRemove.role)) {
        return NextResponse.json(
          { message: "Admins cannot remove owners or other admins" },
          { status: 403 }
        );
      }
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[id]/members - Update member role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { message: "Member ID and role are required" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role. Must be ADMIN or MEMBER" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Only OWNER can change roles
    const currentUserRole = await getUserWorkspaceRole(currentUser.id, id);
    if (currentUserRole !== "OWNER") {
      return NextResponse.json(
        { message: "Only the owner can change member roles" },
        { status: 403 }
      );
    }

    const memberToUpdate = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.workspaceId !== id) {
      return NextResponse.json(
        { message: "Member not found in this workspace" },
        { status: 404 }
      );
    }

    // Cannot change owner's role
    if (memberToUpdate.role === "OWNER") {
      return NextResponse.json(
        { message: "Cannot change owner's role" },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


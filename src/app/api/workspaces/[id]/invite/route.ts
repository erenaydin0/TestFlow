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

// GET /api/workspaces/[id]/invite - Get all pending invites
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

    // Check if user is OWNER or ADMIN
    const userRole = await getUserWorkspaceRole(user.id, id);
    if (!userRole || userRole === "MEMBER") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const invites = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId: id,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/invite - Create an invite
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
    const { email, role = "MEMBER" } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: "Invalid email format" },
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
        { message: "Only owners and admins can invite members" },
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

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user with this email exists and is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
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
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.workspaceInvite.findUnique({
      where: {
        email_workspaceId: {
          email: normalizedEmail,
          workspaceId: id,
        },
      },
    });

    if (existingInvite) {
      // Update the existing invite
      const updatedInvite = await prisma.workspaceInvite.update({
        where: { id: existingInvite.id },
        data: {
          role,
          invitedBy: currentUser.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: new Date(),
        },
      });

      return NextResponse.json({
        ...updatedInvite,
        userExists: !!existingUser,
      });
    }

    // Create new invite
    const invite = await prisma.workspaceInvite.create({
      data: {
        email: normalizedEmail,
        workspaceId: id,
        role,
        invitedBy: currentUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // TODO: Send invitation email here in a real application

    return NextResponse.json(
      {
        ...invite,
        userExists: !!existingUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/invite - Cancel an invite
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
    const inviteId = searchParams.get("inviteId");

    if (!inviteId) {
      return NextResponse.json(
        { message: "Invite ID is required" },
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
        { message: "Only owners and admins can cancel invites" },
        { status: 403 }
      );
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.workspaceId !== id) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }

    await prisma.workspaceInvite.delete({
      where: { id: inviteId },
    });

    return NextResponse.json({ message: "Invite cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling invite:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


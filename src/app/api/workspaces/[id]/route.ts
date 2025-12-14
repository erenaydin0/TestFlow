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

// GET /api/workspaces/[id] - Get workspace details with members
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

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
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
        },
        invites: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...workspace,
      currentUserRole: userRole,
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id] - Update workspace
export async function PUT(
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
    const { name, description } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is OWNER or ADMIN
    const userRole = await getUserWorkspaceRole(user.id, id);
    if (!userRole || userRole === "MEMBER") {
      return NextResponse.json(
        { message: "Only owners and admins can update workspace" },
        { status: 403 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Workspace name is required" },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
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
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Only OWNER can delete workspace
    const userRole = await getUserWorkspaceRole(user.id, id);
    if (userRole !== "OWNER") {
      return NextResponse.json(
        { message: "Only the owner can delete workspace" },
        { status: 403 }
      );
    }

    await prisma.workspace.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


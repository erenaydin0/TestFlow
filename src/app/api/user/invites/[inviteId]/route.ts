import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// POST /api/user/invites/[inviteId] - Accept an invite
export async function POST(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { inviteId } = await params;

    // Find the invite
    const invite = await prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }

    // Check if the invite is for the current user
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { message: "This invite is not for you" },
        { status: 403 }
      );
    }

    // Check if the invite has expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { message: "This invite has expired" },
        { status: 400 }
      );
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (existingMember) {
      // Delete the invite since user is already a member
      await prisma.workspaceInvite.delete({
        where: { id: inviteId },
      });

      return NextResponse.json(
        { message: "You are already a member of this workspace" },
        { status: 400 }
      );
    }

    // Create workspace member and delete invite in a transaction
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      }),
      prisma.workspaceInvite.delete({
        where: { id: inviteId },
      }),
    ]);

    return NextResponse.json({
      message: "Invite accepted successfully",
      workspace: invite.workspace,
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/invites/[inviteId] - Decline an invite
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { inviteId } = await params;

    // Find the invite
    const invite = await prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }

    // Check if the invite is for the current user
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { message: "This invite is not for you" },
        { status: 403 }
      );
    }

    // Delete the invite
    await prisma.workspaceInvite.delete({
      where: { id: inviteId },
    });

    return NextResponse.json({ message: "Invite declined successfully" });
  } catch (error) {
    console.error("Error declining invite:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

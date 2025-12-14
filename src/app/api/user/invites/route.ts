import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET /api/user/invites - Get all pending invites for the current user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const invites = await prisma.workspaceInvite.findMany({
      where: {
        email: session.user.email.toLowerCase(),
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get inviter names
    const invitesWithInviterNames = await Promise.all(
      invites.map(async (invite) => {
        const inviter = await prisma.user.findUnique({
          where: { id: invite.invitedBy },
          select: { name: true, email: true },
        });
        return {
          ...invite,
          inviterName: inviter?.name || inviter?.email || "Unknown",
        };
      })
    );

    return NextResponse.json(invitesWithInviterNames);
  } catch (error) {
    console.error("Error fetching user invites:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

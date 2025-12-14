import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET /api/users/search?email=xxx&workspaceId=xxx - Search users by email
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const workspaceId = searchParams.get("workspaceId");

    if (!email?.trim()) {
      return NextResponse.json(
        { message: "Email query is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by exact email match
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null, isMember: false });
    }

    // If workspaceId is provided, check if user is already a member
    let isMember = false;
    if (workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
      });
      isMember = !!membership;
    }

    return NextResponse.json({
      user,
      isMember,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}



import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = req.headers.get("x-workspace-id");

    if (!workspaceId) {
        return NextResponse.json(
            { message: "Workspace ID is required" },
            { status: 400 }
        );
    }

    try {
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    userId: (session.user as any).id,
                    workspaceId: workspaceId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                { message: "Access denied to this workspace" },
                { status: 403 }
            );
        }

        const executions = await prisma.execution.findMany({
            where: {
                workspaceId: workspaceId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(executions);
    } catch (error) {
        console.error("Error fetching executions:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTestSchema = z.object({
    name: z.string().min(1, "Test name is required"),
    description: z.string().optional(),
    suite: z.string().optional(),
    tags: z.array(z.string()).optional(),
    browserType: z.string().optional(),
    headlessMode: z.boolean().optional(),
    enableScreenshots: z.boolean().optional(),
    enableRecording: z.boolean().optional(),
    workflow: z.array(z.any()).optional(),
});

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
        // Verify user belongs to workspace
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

        const tests = await prisma.test.findMany({
            where: {
                workspaceId: workspaceId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(tests);
    } catch (error) {
        console.error("Error fetching tests:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
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
        const body = await req.json();
        const validatedData = createTestSchema.parse(body);

        // Verify user belongs to workspace
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

        const test = await prisma.test.create({
            data: {
                ...validatedData,
                workspaceId: workspaceId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                userId: (session.user as any).id,
                workflow: validatedData.workflow ? JSON.stringify(validatedData.workflow) : "[]",
            },
        });

        return NextResponse.json(test, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation error", errors: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating test:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

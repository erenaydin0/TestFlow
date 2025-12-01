import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const createScheduledTestSchema = z.object({
    testId: z.string().min(1, "Test ID is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    schedule: z.string().min(1, "Schedule is required"),
    frequency: z.string().min(1, "Frequency is required"),
    environment: z.string().optional(),
    notifyOnFailure: z.boolean().optional(),
    notifyOnSuccess: z.boolean().optional(),
    retryOnFailure: z.boolean().optional(),
    maxRetries: z.number().optional(),
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

        const scheduledTests = await prisma.scheduledTest.findMany({
            where: {
                workspaceId: workspaceId,
            },
            include: {
                test: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Mock upcoming runs for now as we don't have a real scheduler yet
        const upcomingRuns: any[] = [];

        return NextResponse.json({
            scheduledTests,
            upcomingRuns,
        });
    } catch (error) {
        console.error("Error fetching scheduled tests:", error);
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
        const validatedData = createScheduledTestSchema.parse(body);

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

        // Fetch test to get suite info
        const test = await prisma.test.findUnique({
            where: { id: validatedData.testId },
        });

        if (!test) {
            return NextResponse.json({ message: "Test not found" }, { status: 404 });
        }

        const scheduledTest = await prisma.scheduledTest.create({
            data: {
                ...validatedData,
                workspaceId: workspaceId,
                status: "ACTIVE",
                suite: test.suite || "Default",
                description: validatedData.description || "",
                environment: validatedData.environment || "Production",
            },
        });

        return NextResponse.json(scheduledTest, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation error", errors: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating scheduled test:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// Helper to map DB scheduled test to API response
const mapScheduledTestFromDb = (dbScheduledTest: any) => {
    return {
        ...dbScheduledTest,
        lastRun: dbScheduledTest.lastRun ? new Date(dbScheduledTest.lastRun) : null,
        nextRun: dbScheduledTest.nextRun ? new Date(dbScheduledTest.nextRun) : null,
    };
};

const updateScheduledTestSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    schedule: z.string().optional(),
    frequency: z.string().optional(),
    status: z.string().optional(),
    environment: z.string().optional(),
    enabled: z.boolean().optional(),
    notifyOnFailure: z.boolean().optional(),
    notifyOnSuccess: z.boolean().optional(),
    retryOnFailure: z.boolean().optional(),
    maxRetries: z.number().optional(),
    nextRun: z.string().optional(),
    lastRun: z.string().optional(),
    lastDuration: z.number().optional(),
    successRate: z.number().optional(),
});

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

        const scheduledTest = await prisma.scheduledTest.findUnique({
            where: { id },
            include: {
                test: {
                    select: {
                        name: true,
                        workflow: true,
                    }
                }
            }
        });

        if (!scheduledTest) {
            return NextResponse.json(
                { message: "Scheduled test not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (scheduledTest.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: scheduledTest.workspaceId,
                    },
                },
            });

            if (!membership) {
                return NextResponse.json(
                    { message: "Access denied" },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(mapScheduledTestFromDb(scheduledTest));
    } catch (error) {
        console.error("Error fetching scheduled test:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

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
        const validatedData = updateScheduledTestSchema.parse(body);

        const existingScheduledTest = await prisma.scheduledTest.findUnique({
            where: { id }
        });

        if (!existingScheduledTest) {
            return NextResponse.json(
                { message: "Scheduled test not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (existingScheduledTest.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: existingScheduledTest.workspaceId,
                    },
                },
            });

            if (!membership) {
                return NextResponse.json(
                    { message: "Access denied" },
                    { status: 403 }
                );
            }
        }

        // Prepare update data
        const updateData: any = {
            updatedAt: new Date()
        };

        if (validatedData.name) updateData.name = validatedData.name;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.schedule) updateData.schedule = validatedData.schedule;
        if (validatedData.frequency) updateData.frequency = validatedData.frequency;
        if (validatedData.status) updateData.status = validatedData.status;
        if (validatedData.environment) updateData.environment = validatedData.environment;
        if (validatedData.enabled !== undefined) updateData.enabled = validatedData.enabled;
        if (validatedData.notifyOnFailure !== undefined) updateData.notifyOnFailure = validatedData.notifyOnFailure;
        if (validatedData.notifyOnSuccess !== undefined) updateData.notifyOnSuccess = validatedData.notifyOnSuccess;
        if (validatedData.retryOnFailure !== undefined) updateData.retryOnFailure = validatedData.retryOnFailure;
        if (validatedData.maxRetries !== undefined) updateData.maxRetries = validatedData.maxRetries;
        if (validatedData.nextRun) updateData.nextRun = new Date(validatedData.nextRun);
        if (validatedData.lastRun) updateData.lastRun = new Date(validatedData.lastRun);
        if (validatedData.lastDuration !== undefined) updateData.lastDuration = validatedData.lastDuration;
        if (validatedData.successRate !== undefined) updateData.successRate = validatedData.successRate;

        const updated = await prisma.scheduledTest.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(mapScheduledTestFromDb(updated));
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation error", errors: error.issues },
                { status: 400 }
            );
        }
        console.error("Error updating scheduled test:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

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

        const scheduledTest = await prisma.scheduledTest.findUnique({
            where: { id }
        });

        if (!scheduledTest) {
            return NextResponse.json(
                { message: "Scheduled test not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (scheduledTest.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: scheduledTest.workspaceId,
                    },
                },
            });

            if (!membership) {
                return NextResponse.json(
                    { message: "Access denied" },
                    { status: 403 }
                );
            }
        }

        await prisma.scheduledTest.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Scheduled test deleted successfully" });
    } catch (error) {
        console.error("Error deleting scheduled test:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}


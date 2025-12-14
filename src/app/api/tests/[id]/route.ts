import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// Helper to map DB test to API response
const mapTestFromDb = (dbTest: any) => {
    return {
        ...dbTest,
        tags: typeof dbTest.tags === 'string' ? JSON.parse(dbTest.tags || '[]') : dbTest.tags,
        workflow: typeof dbTest.workflow === 'string' ? JSON.parse(dbTest.workflow || '[]') : dbTest.workflow,
    };
};

const updateTestSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    suite: z.string().optional(),
    tags: z.array(z.string()).optional(),
    browserType: z.string().optional(),
    headlessMode: z.boolean().optional(),
    enableScreenshots: z.boolean().optional(),
    enableRecording: z.boolean().optional(),
    isExecutable: z.boolean().optional(),
    workflow: z.array(z.any()).optional(),
    duration: z.number().optional(),
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

        const test = await prisma.test.findUnique({
            where: { id }
        });

        if (!test) {
            return NextResponse.json(
                { message: "Test not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (test.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: test.workspaceId,
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

        return NextResponse.json(mapTestFromDb(test));
    } catch (error) {
        console.error("Error fetching test:", error);
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
        const validatedData = updateTestSchema.parse(body);

        const existingTest = await prisma.test.findUnique({
            where: { id }
        });

        if (!existingTest) {
            return NextResponse.json(
                { message: "Test not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (existingTest.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: existingTest.workspaceId,
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
        if (validatedData.status) updateData.status = validatedData.status;
        if (validatedData.suite) updateData.suite = validatedData.suite;
        if (validatedData.browserType) updateData.browserType = validatedData.browserType;
        if (validatedData.headlessMode !== undefined) updateData.headlessMode = validatedData.headlessMode;
        if (validatedData.enableScreenshots !== undefined) updateData.enableScreenshots = validatedData.enableScreenshots;
        if (validatedData.enableRecording !== undefined) updateData.enableRecording = validatedData.enableRecording;
        if (validatedData.isExecutable !== undefined) updateData.isExecutable = validatedData.isExecutable;
        if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
        if (validatedData.tags) updateData.tags = JSON.stringify(validatedData.tags);
        if (validatedData.workflow) updateData.workflow = JSON.stringify(validatedData.workflow);

        const updated = await prisma.test.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(mapTestFromDb(updated));
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation error", errors: error.issues },
                { status: 400 }
            );
        }
        console.error("Error updating test:", error);
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

        const test = await prisma.test.findUnique({
            where: { id }
        });

        if (!test) {
            return NextResponse.json(
                { message: "Test not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (test.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: test.workspaceId,
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

        await prisma.test.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Test deleted successfully" });
    } catch (error) {
        console.error("Error deleting test:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}


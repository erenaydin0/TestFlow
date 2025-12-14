import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { storage } from "@/lib/supabase";

// Helper to map DB execution to API response with full URLs
const mapExecutionFromDb = (dbExecution: any) => {
    const screenshots = typeof dbExecution.screenshots === 'string' 
        ? JSON.parse(dbExecution.screenshots || '[]') 
        : dbExecution.screenshots;
    
    const steps = typeof dbExecution.steps === 'string' 
        ? JSON.parse(dbExecution.steps || '[]') 
        : dbExecution.steps;

    // Convert screenshot filenames to full Supabase Storage URLs
    const screenshotUrls = screenshots.map((filename: string) => {
        if (filename.startsWith('http')) return filename; // Already a full URL
        return storage.screenshots.getPublicUrl(`${dbExecution.id}/${filename}`);
    });

    // Also update step screenshots to full URLs
    const stepsWithUrls = steps.map((step: any) => {
        if (step.screenshot && !step.screenshot.startsWith('http')) {
            return {
                ...step,
                screenshot: storage.screenshots.getPublicUrl(`${dbExecution.id}/${step.screenshot}`)
            };
        }
        return step;
    });

    return {
        ...dbExecution,
        tags: typeof dbExecution.tags === 'string' ? JSON.parse(dbExecution.tags || '[]') : dbExecution.tags,
        options: typeof dbExecution.options === 'string' ? JSON.parse(dbExecution.options || '{}') : dbExecution.options,
        steps: stepsWithUrls,
        screenshots: screenshotUrls,
        logs: typeof dbExecution.logs === 'string' ? JSON.parse(dbExecution.logs || '[]') : dbExecution.logs,
        // Add video URL if exists
        videoUrl: dbExecution.videoPath ? storage.videos.getPublicUrl(`${dbExecution.id}/${dbExecution.videoPath}`) : null,
    };
};

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
        
        const execution = await prisma.execution.findUnique({
            where: { id }
        });

        if (!execution) {
            return NextResponse.json(
                { message: "Execution not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (execution.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: execution.workspaceId,
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

        return NextResponse.json(mapExecutionFromDb(execution));
    } catch (error) {
        console.error("Error fetching execution:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update execution (used by agent to update status/results)
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

        const existingExecution = await prisma.execution.findUnique({
            where: { id }
        });

        if (!existingExecution) {
            return NextResponse.json(
                { message: "Execution not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (existingExecution.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: existingExecution.workspaceId,
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

        if (body.status) updateData.status = body.status;
        if (body.endTime) updateData.endTime = new Date(body.endTime);
        if (body.duration !== undefined) updateData.duration = body.duration;
        if (body.progress !== undefined) updateData.progress = body.progress;
        if (body.error) updateData.error = body.error;
        if (body.successRate !== undefined) updateData.successRate = body.successRate;
        if (body.videoPath) updateData.videoPath = body.videoPath;
        if (body.steps) updateData.steps = JSON.stringify(body.steps);
        if (body.screenshots) updateData.screenshots = JSON.stringify(body.screenshots);
        if (body.logs) updateData.logs = JSON.stringify(body.logs);

        const updated = await prisma.execution.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(mapExecutionFromDb(updated));
    } catch (error) {
        console.error("Error updating execution:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete execution and associated media
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

        const execution = await prisma.execution.findUnique({
            where: { id }
        });

        if (!execution) {
            return NextResponse.json(
                { message: "Execution not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this workspace
        if (execution.workspaceId) {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: (session.user as any).id,
                        workspaceId: execution.workspaceId,
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

        // Try to delete associated media from Supabase Storage
        try {
            // Delete screenshots
            const screenshots = JSON.parse(execution.screenshots || '[]');
            if (screenshots.length > 0) {
                await storage.screenshots.delete(screenshots.map((s: string) => `${id}/${s}`));
            }
            
            // Delete video
            if (execution.videoPath) {
                await storage.videos.delete([`${id}/${id}.webm`]);
            }
        } catch (mediaError) {
            console.error("Error deleting media:", mediaError);
            // Continue with deletion even if media cleanup fails
        }

        await prisma.execution.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Execution deleted successfully" });
    } catch (error) {
        console.error("Error deleting execution:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}


import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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
        if (filename.startsWith('http')) return filename;
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
        videoUrl: dbExecution.videoPath ? storage.videos.getPublicUrl(`${dbExecution.id}/${dbExecution.videoPath}`) : null,
    };
};

// Schema for creating/queueing an execution
const executeTestSchema = z.object({
    workflowId: z.string().min(1, "Workflow ID is required"),
    workflowName: z.string().min(1, "Workflow name is required"),
    steps: z.array(z.object({
        id: z.string(),
        type: z.string(),
        config: z.any()
    })),
    suite: z.string().optional(),
    tags: z.array(z.string()).optional(),
    options: z.object({
        enableScreenshots: z.boolean().optional(),
        enableRecording: z.boolean().optional(),
        headlessMode: z.boolean().optional(),
        browserType: z.string().optional()
    }).optional()
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
                startTime: "desc",
            },
        });

        return NextResponse.json(executions.map(mapExecutionFromDb));
    } catch (error) {
        console.error("Error fetching executions:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Queue a new test execution
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
        const validatedData = executeTestSchema.parse(body);

        const membership = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
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

        // Generate execution ID
        const timestamp = new Date();
        const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = timestamp.toISOString().slice(11, 19).replace(/:/g, '');
        const shortId = uuidv4().slice(0, 8);
        const executionId = `exec-${dateStr}-${timeStr}-${shortId}`;

        const executionData = {
            id: executionId,
            workflowId: validatedData.workflowId,
            workflowName: validatedData.workflowName,
            status: 'queued',
            startTime: timestamp,
            suite: validatedData.suite || null,
            tags: JSON.stringify(validatedData.tags || []),
            options: JSON.stringify({
                enableScreenshots: validatedData.options?.enableScreenshots || false,
                enableRecording: validatedData.options?.enableRecording || false,
                headlessMode: validatedData.options?.headlessMode ?? true,
                browserType: validatedData.options?.browserType || 'chromium'
            }),
            steps: JSON.stringify(validatedData.steps.map((step: any) => ({
                stepId: step.id,
                type: step.type,
                status: 'pending',
                config: step.config
            }))),
            screenshots: '[]',
            logs: '[]',
            progress: 0,
            workspaceId: workspaceId
        };

        const savedExecution = await prisma.execution.create({
            data: executionData
        });

        return NextResponse.json({
            executionId: savedExecution.id,
            status: 'queued',
            message: 'Execution queued. Start your local agent to run the test.'
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation error", errors: error.issues },
                { status: 400 }
            );
        }
        console.error("Error creating execution:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

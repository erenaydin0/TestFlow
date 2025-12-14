import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Schema for executing a workflow
const executeWorkflowSchema = z.object({
    workflowId: z.string().min(1, "Workflow ID is required"),
    workflowName: z.string().min(1, "Workflow name is required"),
    steps: z.array(z.object({
        id: z.string(),
        type: z.string(),
        config: z.any().optional(),
        description: z.string().optional(),
        selector: z.string().optional(),
        url: z.string().optional(),
        value: z.string().optional(),
        key: z.string().optional(),
        timeout: z.number().optional(),
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

// POST - Queue a new test execution for local agent to pick up
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
        const validatedData = executeWorkflowSchema.parse(body);

        // Verify user belongs to workspace
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

        // Generate unique execution ID
        const timestamp = new Date();
        const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = timestamp.toISOString().slice(11, 19).replace(/:/g, '');
        const shortId = uuidv4().slice(0, 8);
        const executionId = `exec-${dateStr}-${timeStr}-${shortId}`;

        // Create execution record in "queued" status
        // Local agent will poll for queued executions and run them
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
                description: step.description || '',
                selector: step.selector || '',
                url: step.url || '',
                value: step.value || '',
                key: step.key || '',
                timeout: step.timeout || 30000,
                config: step.config || {}
            }))),
            screenshots: '[]',
            logs: '[]',
            progress: 0,
            workspaceId: workspaceId
        };

        const savedExecution = await prisma.execution.create({
            data: executionData
        });

        console.log(`[Execute API] Execution queued: ${executionId} for workflow: ${validatedData.workflowName}`);

        return NextResponse.json({
            executionId: savedExecution.id,
            status: 'queued',
            message: 'Test execution queued. Start your local agent to run the test.'
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

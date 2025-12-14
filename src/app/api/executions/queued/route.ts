import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper to map DB execution to API response
const mapExecutionFromDb = (dbExecution: any) => {
    return {
        ...dbExecution,
        tags: typeof dbExecution.tags === 'string' ? JSON.parse(dbExecution.tags || '[]') : dbExecution.tags,
        options: typeof dbExecution.options === 'string' ? JSON.parse(dbExecution.options || '{}') : dbExecution.options,
        steps: typeof dbExecution.steps === 'string' ? JSON.parse(dbExecution.steps || '[]') : dbExecution.steps,
        screenshots: typeof dbExecution.screenshots === 'string' ? JSON.parse(dbExecution.screenshots || '[]') : dbExecution.screenshots,
        logs: typeof dbExecution.logs === 'string' ? JSON.parse(dbExecution.logs || '[]') : dbExecution.logs,
    };
};

// GET - Get queued executions for local agent
// This endpoint uses service key authentication for agent access
export async function GET(req: Request) {
    // Check for service key authentication (for local agent)
    const authHeader = req.headers.get("authorization");
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!authHeader || !serviceKey) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    if (token !== serviceKey) {
        return NextResponse.json({ message: "Invalid service key" }, { status: 401 });
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    try {
        const whereClause: any = {
            status: 'queued'
        };

        if (workspaceId) {
            whereClause.workspaceId = workspaceId;
        }

        const executions = await prisma.execution.findMany({
            where: whereClause,
            orderBy: {
                startTime: "asc", // FIFO - oldest first
            },
            take: limit
        });

        return NextResponse.json(executions.map(mapExecutionFromDb));
    } catch (error) {
        console.error("Error fetching queued executions:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH - Update execution status (for local agent)
export async function PATCH(req: Request) {
    // Check for service key authentication
    const authHeader = req.headers.get("authorization");
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!authHeader || !serviceKey) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== serviceKey) {
        return NextResponse.json({ message: "Invalid service key" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { executionId, status, progress, error, logs, screenshots, steps, endTime } = body;

        if (!executionId) {
            return NextResponse.json(
                { message: "Execution ID is required" },
                { status: 400 }
            );
        }

        const updateData: any = {
            updatedAt: new Date()
        };

        if (status) updateData.status = status;
        if (progress !== undefined) updateData.progress = progress;
        if (error) updateData.error = error;
        if (logs) updateData.logs = JSON.stringify(logs);
        if (screenshots) updateData.screenshots = JSON.stringify(screenshots);
        if (steps) updateData.steps = JSON.stringify(steps);
        if (endTime) updateData.endTime = new Date(endTime);

        const updated = await prisma.execution.update({
            where: { id: executionId },
            data: updateData
        });

        console.log(`[Queued API] Execution updated: ${executionId} -> ${status || 'progress update'}`);

        return NextResponse.json(mapExecutionFromDb(updated));
    } catch (error) {
        console.error("Error updating execution:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

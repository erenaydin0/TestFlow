import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                workspaces: {
                    include: {
                        workspace: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workspaces = user.workspaces.map((w: any) => ({
            id: w.workspace.id,
            name: w.workspace.name,
            role: w.role,
        }));

        return NextResponse.json(workspaces);
    } catch (error) {
        console.error("Error fetching workspaces:", error);
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

    try {
        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { message: "Workspace name is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Transaction to create workspace and add user as owner
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workspace = await prisma.$transaction(async (tx: any) => {
            const newWorkspace = await tx.workspace.create({
                data: {
                    name,
                    description,
                },
            });

            await tx.workspaceMember.create({
                data: {
                    userId: user.id,
                    workspaceId: newWorkspace.id,
                    role: "OWNER",
                },
            });

            return newWorkspace;
        });

        return NextResponse.json(workspace, { status: 201 });
    } catch (error) {
        console.error("Error creating workspace:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

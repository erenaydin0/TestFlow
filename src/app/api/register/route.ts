import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = registerSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Transaction to create user, workspace, and membership
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
            });

            // 2. Create Default Workspace
            const workspace = await tx.workspace.create({
                data: {
                    name: `${name}'s Workspace`,
                    description: "Your personal workspace",
                },
            });

            // 3. Add User to Workspace as OWNER
            await tx.workspaceMember.create({
                data: {
                    userId: user.id,
                    workspaceId: workspace.id,
                    role: "OWNER",
                },
            });

            return user;
        });

        return NextResponse.json(
            { message: "User created successfully", user: { id: result.id, email: result.email, name: result.name } },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation error", errors: (error as z.ZodError).errors },
                { status: 400 }
            );
        }
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

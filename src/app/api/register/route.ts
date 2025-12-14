import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = registerSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json(
                { 
                    message: "Bu e-posta adresi zaten kayıtlı",
                    code: "EMAIL_EXISTS"
                },
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
                    email: email.toLowerCase(),
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
            { message: "Kayıt başarılı", user: { id: result.id, email: result.email, name: result.name } },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            // Get the first validation error message
            const firstError = error.issues[0];
            return NextResponse.json(
                { 
                    message: firstError.message,
                    code: "VALIDATION_ERROR",
                    field: firstError.path[0]
                },
                { status: 400 }
            );
        }
        
        // Log the actual error for debugging
        console.error("Registration error:", error);
        
        // Check for specific database errors
        if (error && typeof error === 'object' && 'code' in error) {
            const dbError = error as { code: string };
            if (dbError.code === 'P2002') {
                return NextResponse.json(
                    { 
                        message: "Bu e-posta adresi zaten kayıtlı",
                        code: "EMAIL_EXISTS"
                    },
                    { status: 400 }
                );
            }
        }
        
        return NextResponse.json(
            { 
                message: "Kayıt işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                code: "SERVER_ERROR"
            },
            { status: 500 }
        );
    }
}

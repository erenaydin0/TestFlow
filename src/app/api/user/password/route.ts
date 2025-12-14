import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { currentPassword, newPassword } = changePasswordSchema.parse(body);

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                password: true,
            },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { message: "User not found or password not set" },
                { status: 404 }
            );
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { message: "Current password is incorrect" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: error.message },
                { status: 400 }
            );
        }

        console.error("Password change error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}


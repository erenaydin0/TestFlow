import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
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
        const { name } = updateProfileSchema.parse(body);

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { name },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: error.message },
                { status: 400 }
            );
        }

        console.error("Profile update error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Get profile error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}


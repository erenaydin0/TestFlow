import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

// Avatar settings
const AVATAR_SIZE = 256; // Max width/height in pixels
const AVATAR_QUALITY = 85; // JPEG quality (1-100)

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("avatar") as File | null;

        if (!file) {
            return NextResponse.json(
                { message: "No file uploaded" },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { message: "Invalid file type. Please upload a JPEG, PNG, GIF or WebP image." },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB before processing)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { message: "File too large. Maximum size is 5MB." },
                { status: 400 }
            );
        }

        // Get current user to find old avatar
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { image: true },
        });

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename with timestamp for cache-busting
        const timestamp = Date.now();
        const sanitizedEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `${sanitizedEmail}_${timestamp}.jpg`; // Always save as JPEG for consistency
        const filepath = join(uploadsDir, filename);

        // Process image with sharp: resize and optimize
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await sharp(buffer)
            .resize(AVATAR_SIZE, AVATAR_SIZE, {
                fit: "cover", // Crop to fill the square
                position: "center",
            })
            .jpeg({
                quality: AVATAR_QUALITY,
                progressive: true,
            })
            .toFile(filepath);

        // Delete old avatar file if it exists and is a local file
        if (currentUser?.image && currentUser.image.startsWith("/uploads/avatars/")) {
            const oldFilePath = join(process.cwd(), "public", currentUser.image);
            try {
                if (existsSync(oldFilePath)) {
                    await unlink(oldFilePath);
                }
            } catch (deleteError) {
                // Log but don't fail if old file deletion fails
                console.warn("Failed to delete old avatar:", deleteError);
            }
        }

        // Update user image in database with cache-busting query param
        const imagePath = `/uploads/avatars/${filename}?v=${timestamp}`;
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: imagePath },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({
            message: "Avatar uploaded successfully",
            image: imagePath,
            user,
        });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE endpoint to remove avatar
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get current user to find avatar path
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { image: true },
        });

        // Delete avatar file if it exists and is a local file
        if (currentUser?.image && currentUser.image.startsWith("/uploads/avatars/")) {
            // Remove query params from path
            const imagePath = currentUser.image.split("?")[0];
            const filePath = join(process.cwd(), "public", imagePath);
            try {
                if (existsSync(filePath)) {
                    await unlink(filePath);
                }
            } catch (deleteError) {
                console.warn("Failed to delete avatar file:", deleteError);
            }
        }

        // Update user to remove avatar
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: null },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({
            message: "Avatar removed successfully",
            user,
        });
    } catch (error) {
        console.error("Avatar deletion error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

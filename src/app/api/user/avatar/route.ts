import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
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
            select: { id: true, image: true },
        });

        if (!currentUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Generate unique filename with timestamp for cache-busting
        const timestamp = Date.now();
        const filename = `${currentUser.id}_${timestamp}.jpg`; // Always save as JPEG for consistency

        // Process image with sharp: resize and optimize
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const processedBuffer = await sharp(buffer)
            .resize(AVATAR_SIZE, AVATAR_SIZE, {
                fit: "cover", // Crop to fill the square
                position: "center",
            })
            .jpeg({
                quality: AVATAR_QUALITY,
                progressive: true,
            })
            .toBuffer();

        // Delete old avatar from Supabase Storage if it exists
        if (currentUser.image && currentUser.image.includes('supabase.co')) {
            try {
                // Extract filename from URL
                const oldFilename = currentUser.image.split('/').pop()?.split('?')[0];
                if (oldFilename) {
                    await storage.avatars.delete([oldFilename]);
                }
            } catch (deleteError) {
                // Log but don't fail if old file deletion fails
                console.warn("Failed to delete old avatar:", deleteError);
            }
        }

        // Upload to Supabase Storage
        await storage.avatars.upload(filename, processedBuffer, 'image/jpeg');
        
        // Get public URL
        const publicUrl = storage.avatars.getPublicUrl(filename);

        // Update user image in database with cache-busting query param
        const imageUrl = `${publicUrl}?v=${timestamp}`;
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: imageUrl },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({
            message: "Avatar uploaded successfully",
            image: imageUrl,
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

        // Delete avatar from Supabase Storage if it exists
        if (currentUser?.image && currentUser.image.includes('supabase.co')) {
            try {
                // Extract filename from URL
                const filename = currentUser.image.split('/').pop()?.split('?')[0];
                if (filename) {
                    await storage.avatars.delete([filename]);
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

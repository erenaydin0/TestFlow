import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    const name = "Test User";

    console.log(`Registering user directly via Prisma: ${email}`);

    // Simulate the logic from the API route
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
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

    console.log("User created:", result.id);

    // 2. Verify DB
    const user = await prisma.user.findUnique({
        where: { email },
        include: { workspaces: { include: { workspace: true } } },
    });

    if (!user) {
        console.error("User not found in DB!");
        process.exit(1);
    }

    console.log("User found:", user.id);

    if (user.workspaces.length === 0) {
        console.error("No workspace found for user!");
        process.exit(1);
    }

    const membership = user.workspaces[0];
    console.log("Workspace found:", membership.workspace.name);
    console.log("Role:", membership.role);

    if (membership.role !== "OWNER") {
        console.error("User is not OWNER of the workspace!");
        process.exit(1);
    }

    console.log("Verification SUCCESS!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

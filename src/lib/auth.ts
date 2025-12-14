import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    throw new Error("Invalid credentials");
                }

                return user;
            },
        }),
    ],
    callbacks: {
        async session({ session, token, trigger }) {
            if (token && session.user) {
                // Add user ID to session
                (session.user as any).id = token.sub;
                // Add name and image from token
                session.user.name = token.name as string;
                session.user.image = token.picture as string;
            }
            
            // If session update is triggered, fetch fresh data from database
            if (trigger === "update" && session.user?.email) {
                const freshUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { name: true, image: true },
                });
                if (freshUser) {
                    session.user.name = freshUser.name;
                    session.user.image = freshUser.image;
                }
            }
            
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.picture = user.image;
            }
            
            // Handle session update - update token with new values
            if (trigger === "update" && session) {
                // Fetch fresh data from database
                const freshUser = await prisma.user.findUnique({
                    where: { email: token.email as string },
                    select: { name: true, image: true },
                });
                if (freshUser) {
                    token.name = freshUser.name;
                    token.picture = freshUser.image;
                }
            }
            
            return token;
        },
    },
};

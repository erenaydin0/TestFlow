import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

                // Generate access token for WebSocket authentication (Supabase compatible)
                const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
                const nextAuthSecret = process.env.NEXTAUTH_SECRET;

                if (supabaseSecret) {
                    console.log('[Auth] using SUPABASE_JWT_SECRET (Length: ' + supabaseSecret.length + ')');
                } else if (nextAuthSecret) {
                    console.warn('[Auth] WARNING: SUPABASE_JWT_SECRET is missing. Falling back to NEXTAUTH_SECRET. Realtime will likely fail.');
                } else {
                    console.error('[Auth] ERROR: No secrets available for JWT signing');
                }

                const secret = supabaseSecret || nextAuthSecret;
                if (secret && token.sub) {
                    console.log('[Auth] Generating Supabase JWT with secret length:', secret.length);
                    const accessToken = jwt.sign(
                        {
                            sub: token.sub, // 'sub' is standard for user ID
                            userId: token.sub, // keep for backward compatibility if needed
                            email: token.email,
                            role: 'authenticated', // Required for Supabase RLS
                            aud: 'authenticated',  // Required for Supabase RLS
                            iat: Math.floor(Date.now() / 1000)
                        },
                        secret,
                        { expiresIn: '24h' }
                    );
                    (session as any).accessToken = accessToken;
                } else {
                    console.warn('[Auth] No secret found for JWT generation');
                }
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

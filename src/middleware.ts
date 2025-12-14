import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const isAuth = !!token;

    // The matcher handles exclusion of public paths (login, register, static files, etc.)
    // So if we are here, it's a protected route.

    if (!isAuth) {
        const url = new URL("/login", req.url);
        url.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - api/register (registration API)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - register (register page)
         * - icon.svg (app icon)
         * - locales (locales)
         */
        "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|login|register|icon.svg|locales).*)",
    ],
};

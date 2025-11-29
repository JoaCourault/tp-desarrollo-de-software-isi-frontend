import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const publicPaths = ["/", "/login"];

    const { pathname } = req.nextUrl;

    if (publicPaths.includes(pathname)) return NextResponse.next();

    const authCookie = req.cookies.get("auth")?.value;

    if (!authCookie) {
        const loginUrl = new URL("/", req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/reservas/:path*",
        "/huesped/:path*",
        "/habitaciones/:path*",
        "/api/:path*",
    ],
};

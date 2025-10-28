import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Redirect requests to the site root `/` -> `/about`
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only redirect the exact root path. Leave all other paths alone.
    if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/about";
        return NextResponse.redirect(url, 307);
    }

    return NextResponse.next();
}

// Limit middleware to only run for the root path for efficiency.
export const config = {
    matcher: "/",
};

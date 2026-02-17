import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Public routes that don't need auth
    const publicPaths = ["/login", "/api/auth"]
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

    if (isPublicPath) {
        return NextResponse.next()
    }

    const session = await auth()

    if (!session?.user) {
        const loginUrl = new URL("/login", req.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}

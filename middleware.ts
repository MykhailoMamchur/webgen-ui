import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  await supabase.auth.getSession()

  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define specific public API paths that don't require authentication
  const isPublicApiPath =
    path === "/api/auth/login" ||
    path === "/api/auth/signup" ||
    path === "/api/auth/refresh" ||
    path === "/api/auth/reset-password" ||
    path === "/api/auth/verify-email" ||
    path === "/api/auth/resend-verification"

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/login" ||
    path === "/signup" ||
    path === "/reset-password" ||
    path === "/verify-email" ||
    path === "/resend-verification" ||
    path === "/auth/callback" ||
    isPublicApiPath // Only specific API routes are public

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  // Only redirect authenticated users away from public routes
  if (isAuthenticated && isPublicPath) {
    // Redirect to home if authenticated and trying to access a public route
    return NextResponse.redirect(new URL("/", request.url))
  }

  // For protected routes, check authentication
  if (!isAuthenticated && !isPublicPath) {
    // If the request is for an API route, return a 401 response instead of redirecting
    if (path.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // If no session and not an API route, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return res
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}

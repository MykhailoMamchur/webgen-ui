// Create a new middleware.ts file at the root of the project
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/signup" || path === "/reset-password" || path === "/verify-email"

  // Check if user is authenticated
  const token = request.cookies.get("auth_token")?.value
  const isAuthenticated = !!token

  // Redirect logic
  if (!isAuthenticated && !isPublicPath) {
    // Redirect to signup if not authenticated and trying to access a protected route
    return NextResponse.redirect(new URL("/signup", request.url))
  }

  if (isAuthenticated && isPublicPath) {
    // Redirect to home if authenticated and trying to access a public route
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/login", "/signup", "/reset-password", "/verify-email", "/account/:path*"],
}

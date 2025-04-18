// Create a new middleware.ts file at the root of the project
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Function to check if a JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    // Extract the payload from the JWT token
    const base64Url = token.split(".")[1]
    if (!base64Url) return true

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const { exp } = JSON.parse(jsonPayload)

    // Check if the token is expired
    if (!exp) return false
    const currentTime = Math.floor(Date.now() / 1000)
    return currentTime >= exp
  } catch (error) {
    console.error("Error checking token expiration:", error)
    return true // If we can't parse the token, assume it's expired
  }
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/signup" || path === "/reset-password" || path === "/verify-email"

  // Check if user is authenticated
  const accessToken = request.cookies.get("access_token")?.value
  const refreshToken = request.cookies.get("refresh_token")?.value

  // Check if access token exists and is not expired
  const isAuthenticated = !!accessToken && !isTokenExpired(accessToken)

  // Check if refresh token exists (for potential refresh)
  const hasRefreshToken = !!refreshToken

  // Only redirect authenticated users away from public routes
  if (isAuthenticated && isPublicPath) {
    // Redirect to home if authenticated and trying to access a public route
    return NextResponse.redirect(new URL("/", request.url))
  }

  // For protected routes, check authentication
  if (!isAuthenticated && !isPublicPath) {
    // If we have a refresh token but access token is expired, let the client handle refresh
    // The client-side code will attempt to refresh before redirecting
    if (hasRefreshToken) {
      // Allow the request to continue - client will handle refresh
      return NextResponse.next()
    }

    // If no refresh token, redirect to signup
    return NextResponse.redirect(new URL("/signup", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/login", "/signup", "/reset-password", "/verify-email", "/account/:path*"],
}

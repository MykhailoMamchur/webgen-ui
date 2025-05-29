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

// Function to refresh tokens using the refresh token
async function refreshTokens(request: NextRequest, refreshToken: string) {
  try {
    console.log("Middleware: Attempting to refresh tokens...")

    // Call the refresh endpoint
    const refreshResponse = await fetch(new URL("/api/auth/refresh", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    if (!refreshResponse.ok) {
      console.error("Middleware: Token refresh failed with status:", refreshResponse.status)
      return null
    }

    const refreshData = await refreshResponse.json()
    console.log("Middleware: Tokens refreshed successfully")

    return {
      accessToken: refreshData.access_token,
      refreshToken: refreshData.refresh_token,
    }
  } catch (error) {
    console.error("Middleware: Error refreshing tokens:", error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/signup" || path === "/reset-password" || path === "/verify-email"

  // Check if user is authenticated
  const accessToken = request.cookies.get("access_token")?.value
  const refreshToken = request.cookies.get("refresh_token")?.value

  // Check if access token exists and is not expired
  const hasAccessToken = !!accessToken
  const isAccessTokenExpired = hasAccessToken ? isTokenExpired(accessToken) : true
  const isAuthenticated = hasAccessToken && !isAccessTokenExpired

  // Check if refresh token exists
  const hasValidRefreshToken = !!refreshToken

  // Only redirect authenticated users away from public routes
  if (isAuthenticated && isPublicPath) {
    console.log("Middleware: Redirecting authenticated user away from public route")
    return NextResponse.redirect(new URL("/", request.url))
  }

  // For protected routes, check authentication
  if (!isAuthenticated && !isPublicPath) {
    // If access token is expired but we have a valid refresh token, try to refresh
    if (isAccessTokenExpired && hasValidRefreshToken) {
      console.log("Middleware: Access token expired, attempting refresh...")

      const newTokens = await refreshTokens(request, refreshToken)

      if (newTokens) {
        // Create response and set new cookies
        const response = NextResponse.next()

        // Set the new access token cookie
        response.cookies.set({
          name: "access_token",
          value: newTokens.accessToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
          path: "/",
        })

        // Set the new refresh token cookie
        response.cookies.set({
          name: "refresh_token",
          value: newTokens.refreshToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        })

        console.log("Middleware: Tokens refreshed and cookies set, allowing request to continue")
        return response
      } else {
        // If refresh fails, clear cookies and redirect to login
        console.log("Middleware: Token refresh failed, redirecting to login")
        const response = NextResponse.redirect(new URL("/login", request.url))
        response.cookies.delete("access_token")
        response.cookies.delete("refresh_token")
        return response
      }
    }

    // If no valid refresh token, redirect to login
    console.log("Middleware: No valid authentication, redirecting to login")
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("access_token")
    response.cookies.delete("refresh_token")
    return response
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/login", "/signup", "/reset-password", "/verify-email", "/account/:path*"],
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getApiBaseUrl, COOKIE_DOMAIN, useSecureCookies } from "./lib/config"

// Function to check if a JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    console.log(`Middleware: Checking token expiration for token: ${token.substring(0, 20)}...`)

    // Extract the payload from the JWT token
    const parts = token.split(".")
    if (parts.length !== 3) {
      console.log("Middleware: Token doesn't have 3 parts, considering expired")
      return true
    }

    const base64Url = parts[1]
    if (!base64Url) {
      console.log("Middleware: No payload part found, considering expired")
      return true
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const payload = JSON.parse(jsonPayload)
    console.log(`Middleware: Token payload parsed successfully, exp: ${payload.exp}`)

    const { exp } = payload

    // Check if the token is expired
    if (!exp) {
      console.log("Middleware: No expiration time in token, considering valid")
      return false
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = currentTime >= exp
    const timeUntilExpiry = exp - currentTime

    console.log(
      `Middleware: Current time: ${currentTime}, Token exp: ${exp}, Time until expiry: ${timeUntilExpiry}s, Is expired: ${isExpired}`,
    )

    return isExpired
  } catch (error) {
    console.error("Middleware: Error checking token expiration:", error)
    return true // If we can't parse the token, assume it's expired
  }
}

// Function to check if token is about to expire (within 5 minutes)
function isTokenExpiringSoon(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return true

    const base64Url = parts[1]
    if (!base64Url) return true

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const { exp } = JSON.parse(jsonPayload)

    if (!exp) return false
    const currentTime = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = exp - currentTime

    // Return true if token expires within 5 minutes (300 seconds)
    return timeUntilExpiry < 300
  } catch (error) {
    console.error("Middleware: Error checking token expiration:", error)
    return true
  }
}

// Function to refresh tokens by calling external API
async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    console.log("Middleware: Attempting to refresh tokens via external API...")

    // Get the API base URL from config
    const apiBaseUrl = getApiBaseUrl()
    console.log(`Middleware: Using API base URL: ${apiBaseUrl}`)

    // Call the external refresh endpoint directly
    const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    console.log(`Middleware: Backend refresh response status: ${refreshResponse.status}`)

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text().catch(() => "Unknown error")
      console.error("Middleware: Token refresh failed:", errorText)
      return null
    }

    const refreshData = await refreshResponse.json()
    console.log("Middleware: Tokens refreshed successfully via backend")

    return {
      accessToken: refreshData.access_token,
      refreshToken: refreshData.refresh_token,
    }
  } catch (error) {
    console.error("Middleware: Error refreshing tokens:", error)
    return null
  }
}

// Function to clear authentication cookies
function clearAuthCookies(response: NextResponse) {
  console.log("Middleware: Clearing authentication cookies")
  response.cookies.set({
    name: "access_token",
    value: "",
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    domain: COOKIE_DOMAIN,
  })

  response.cookies.set({
    name: "refresh_token",
    value: "",
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    domain: COOKIE_DOMAIN,
  })
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname
  console.log(`Middleware: Processing request to ${path}`)

  // Skip middleware for static files and API routes
  if (path.startsWith("/api/") || path.startsWith("/_next/") || (path.includes(".") && !path.endsWith("/"))) {
    return NextResponse.next()
  }

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/login" ||
    path === "/signup" ||
    path === "/reset-password" ||
    path === "/verify-email" ||
    path === "/resend-verification" ||
    path === "/subscribe"

  // Check if user is authenticated
  const accessToken = request.cookies.get("access_token")?.value
  const refreshToken = request.cookies.get("refresh_token")?.value

  console.log(`Middleware: Access token exists: ${!!accessToken}`)
  console.log(`Middleware: Refresh token exists: ${!!refreshToken}`)

  if (accessToken) {
    console.log(`Middleware: Access token preview: ${accessToken.substring(0, 50)}...`)
  }
  if (refreshToken) {
    console.log(`Middleware: Refresh token preview: ${refreshToken.substring(0, 50)}...`)
  }

  // Check if access token exists and is not expired
  const hasAccessToken = !!accessToken
  const isAccessTokenExpired = hasAccessToken ? isTokenExpired(accessToken) : true
  const isAccessTokenExpiringSoon = hasAccessToken ? isTokenExpiringSoon(accessToken) : true
  const isAuthenticated = hasAccessToken && !isAccessTokenExpired

  // Check if refresh token exists and is not expired
  const hasValidRefreshToken = !!refreshToken

  console.log(`Middleware: Is authenticated: ${isAuthenticated}`)
  console.log(`Middleware: Access token expired: ${isAccessTokenExpired}`)
  console.log(`Middleware: Has valid refresh token: ${hasValidRefreshToken}`)

  // Only redirect authenticated users away from auth-specific public routes (not subscribe)
  if (isAuthenticated && isPublicPath && path !== "/subscribe") {
    console.log("Middleware: Redirecting authenticated user away from public route")
    return NextResponse.redirect(new URL("/", request.url))
  }

  // For authenticated users with tokens expiring soon, try to refresh proactively
  if (isAuthenticated && isAccessTokenExpiringSoon && hasValidRefreshToken) {
    console.log("Middleware: Access token expiring soon, attempting proactive refresh...")

    const newTokens = await refreshTokens(refreshToken)

    if (newTokens) {
      // Create response and set new cookies
      const response = NextResponse.next()

      // Set the new access token cookie
      response.cookies.set({
        name: "access_token",
        value: newTokens.accessToken,
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
        domain: COOKIE_DOMAIN,
      })

      // Set the new refresh token cookie
      response.cookies.set({
        name: "refresh_token",
        value: newTokens.refreshToken,
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        domain: COOKIE_DOMAIN,
      })

      console.log("Middleware: Tokens refreshed proactively, allowing request to continue")
      return response
    } else {
      console.log("Middleware: Proactive refresh failed, but continuing with current token")
    }
  }

  // For protected routes, check authentication
  if (!isAuthenticated && !isPublicPath) {
    // If access token is expired but we have a valid refresh token, try to refresh
    if (isAccessTokenExpired && hasValidRefreshToken) {
      console.log("Middleware: Access token expired, attempting refresh...")

      const newTokens = await refreshTokens(refreshToken)

      if (newTokens) {
        // Create response and set new cookies
        const response = NextResponse.next()

        // Set the new access token cookie
        response.cookies.set({
          name: "access_token",
          value: newTokens.accessToken,
          httpOnly: true,
          secure: useSecureCookies,
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
          path: "/",
          domain: COOKIE_DOMAIN,
        })

        // Set the new refresh token cookie
        response.cookies.set({
          name: "refresh_token",
          value: newTokens.refreshToken,
          httpOnly: true,
          secure: useSecureCookies,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
          domain: COOKIE_DOMAIN,
        })

        console.log("Middleware: Tokens refreshed and cookies set, allowing request to continue")
        return response
      } else {
        // If refresh fails, clear cookies and redirect to login
        console.log("Middleware: Token refresh failed, clearing cookies and redirecting to login")
        const response = NextResponse.redirect(new URL("/login", request.url))
        clearAuthCookies(response)
        return response
      }
    }

    // If no valid refresh token, clear cookies and redirect to login
    console.log("Middleware: No valid authentication, redirecting to login")
    const response = NextResponse.redirect(new URL("/login", request.url))
    clearAuthCookies(response)
    return response
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

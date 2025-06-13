import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL, COOKIE_DOMAIN, useSecureCookies, TOKEN_EXPIRY } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    console.log("Refresh API: Starting token refresh process...")

    // Get the refresh token from the cookies
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      console.log("Refresh API: No refresh token found in cookies")
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 })
    }

    console.log("Refresh API: Found refresh token, calling backend...")

    // Forward the request to the API endpoint
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    console.log(`Refresh API: Backend responded with status ${response.status}`)

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
      console.error("Refresh API: Backend refresh failed:", errorData)

      // Create response to clear cookies on refresh failure
      const errorResponse = NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to refresh token: ${response.status}` },
        { status: response.status },
      )

      // Clear cookies when refresh fails
      errorResponse.cookies.set({
        name: "access_token",
        value: "",
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: 0,
        path: "/",
        domain: COOKIE_DOMAIN,
      })

      errorResponse.cookies.set({
        name: "refresh_token",
        value: "",
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: 0,
        path: "/",
        domain: COOKIE_DOMAIN,
      })

      return errorResponse
    }

    // Parse the response data
    const data = await response.json()
    console.log("Refresh API: Successfully got new tokens from backend")

    // Create the response object
    const apiResponse = NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      message: "Token refreshed successfully",
    })

    // Set the new access token in a cookie
    apiResponse.cookies.set({
      name: "access_token",
      value: data.access_token,
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: TOKEN_EXPIRY, // 3 days
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    // Set the new refresh token in a cookie
    apiResponse.cookies.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: TOKEN_EXPIRY, // 3 days
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    console.log("Refresh API: New cookies set successfully")
    return apiResponse
  } catch (error) {
    console.error("Refresh API: Unexpected error:", error)

    // Create response to clear cookies on unexpected error
    const errorResponse = NextResponse.json(
      { error: `Failed to refresh token: ${(error as Error).message}` },
      { status: 500 },
    )

    // Clear cookies on unexpected error
    errorResponse.cookies.set({
      name: "access_token",
      value: "",
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    errorResponse.cookies.set({
      name: "refresh_token",
      value: "",
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    return errorResponse
  }
}

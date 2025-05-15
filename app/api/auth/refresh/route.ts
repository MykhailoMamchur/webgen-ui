import { type NextRequest, NextResponse } from "next/server"
import { getApiUrl, COOKIE_DOMAIN, useSecureCookies } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the refresh token from the cookies
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 })
    }

    console.log("Attempting to refresh token with refresh_token:", refreshToken.substring(0, 10) + "...")

    // Forward the request to the API endpoint using the helper function
    const response = await fetch(getApiUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to refresh token: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()
    console.log("Refresh token response data:", JSON.stringify(data, null, 2))

    // Create the response object
    const apiResponse = NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      session_token: data.session_token,
      message: "Token refreshed successfully",
    })

    // Set the new access token in a cookie
    if (data.access_token) {
      console.log("Setting new access_token cookie")
      apiResponse.cookies.set({
        name: "access_token",
        value: data.access_token,
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
        domain: COOKIE_DOMAIN || undefined,
      })
    } else {
      console.error("No access_token in refresh response")
    }

    // Set the new refresh token in a cookie
    if (data.refresh_token) {
      console.log("Setting new refresh_token cookie")
      apiResponse.cookies.set({
        name: "refresh_token",
        value: data.refresh_token,
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        domain: COOKIE_DOMAIN || undefined,
      })
    } else {
      console.error("No refresh_token in refresh response")
    }

    // Set session token if available (for compatibility with some systems)
    if (data.session_token) {
      console.log("Setting session_token cookie")
      apiResponse.cookies.set({
        name: "session_token",
        value: data.session_token,
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
        domain: COOKIE_DOMAIN || undefined,
      })
    }

    return apiResponse
  } catch (error) {
    console.error("Error in refresh token API route:", error)
    return NextResponse.json({ error: `Failed to refresh token: ${(error as Error).message}` }, { status: 500 })
  }
}

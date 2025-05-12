import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL, COOKIE_DOMAIN, useSecureCookies } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the access token from the cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Forward the request to the API endpoint if we have a token
    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        })
      } catch (error) {
        // Log but continue - we still want to clear cookies even if the API call fails
        console.error("Error calling logout API:", error)
      }
    }

    // Create the response object
    const apiResponse = NextResponse.json({
      message: "Logged out successfully",
    })

    // Clear the access token cookie
    apiResponse.cookies.set({
      name: "access_token",
      value: "",
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    // Clear the refresh token cookie
    apiResponse.cookies.set({
      name: "refresh_token",
      value: "",
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    return apiResponse
  } catch (error) {
    console.error("Error in logout API route:", error)
    return NextResponse.json({ error: `Failed to logout: ${(error as Error).message}` }, { status: 500 })
  }
}

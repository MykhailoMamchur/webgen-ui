import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the refresh token from the request cookies
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token found" }, { status: 401 })
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    // Create the response object
    const apiResponse = NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      message: "Token refreshed successfully",
    })

    // Set the access token in a cookie
    apiResponse.cookies.set({
      name: "access_token",
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
    })

    // Set the refresh token in a cookie
    apiResponse.cookies.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
    })

    return apiResponse
  } catch (error) {
    console.error("Error in refresh token API route:", error)
    return NextResponse.json({ error: `Failed to refresh token: ${(error as Error).message}` }, { status: 500 })
  }
}

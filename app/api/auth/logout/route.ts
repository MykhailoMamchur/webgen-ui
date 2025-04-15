import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value
    const refreshToken = request.cookies.get("refresh_token")?.value

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    // Create a response
    const apiResponse = NextResponse.json({
      status: "success",
      message: "Logged out successfully",
    })

    // Clear the access token cookie
    apiResponse.cookies.set({
      name: "access_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
    })

    // Clear the refresh token cookie
    apiResponse.cookies.set({
      name: "refresh_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
    })

    return apiResponse
  } catch (error) {
    console.error("Error in logout API route:", error)
    return NextResponse.json({ error: `Failed to logout: ${(error as Error).message}` }, { status: 500 })
  }
}

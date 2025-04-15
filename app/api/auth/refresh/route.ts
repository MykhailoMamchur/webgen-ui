import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request cookies
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No authentication token found" }, { status: 401 })
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

    // Set the auth token in a cookie
    const response2 = NextResponse.json({
      token: data.token,
      message: "Token refreshed successfully",
    })

    // Set a secure HTTP-only cookie with the new token
    // Expires in 7 days
    response2.cookies.set({
      name: "auth_token",
      value: data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from strict to lax to allow cross-site requests
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined, // Use root domain in production
    })

    return response2
  } catch (error) {
    console.error("Error in refresh token API route:", error)
    return NextResponse.json({ error: `Failed to refresh token: ${(error as Error).message}` }, { status: 500 })
  }
}

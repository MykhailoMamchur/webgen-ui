import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request cookies
    const token = request.cookies.get("auth_token")?.value

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    // Create a response
    const apiResponse = NextResponse.json({
      status: "success",
      message: "Logged out successfully",
    })

    // Clear the auth token cookie
    apiResponse.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    return apiResponse
  } catch (error) {
    console.error("Error in logout API route:", error)
    return NextResponse.json({ error: `Failed to logout: ${(error as Error).message}` }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL, COOKIE_DOMAIN, useSecureCookies } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure email and password are provided
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to login: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()

    // Create the response object
    const apiResponse = NextResponse.json({
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      message: "Login successful",
    })

    // Set the access token in a cookie
    apiResponse.cookies.set({
      name: "access_token",
      value: data.access_token,
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    // Set the refresh token in a cookie
    apiResponse.cookies.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      domain: COOKIE_DOMAIN,
    })

    return apiResponse
  } catch (error) {
    console.error("Error in login API route:", error)
    return NextResponse.json({ error: `Failed to login: ${(error as Error).message}` }, { status: 500 })
  }
}

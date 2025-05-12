import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL, COOKIE_DOMAIN, useSecureCookies } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure required fields are provided
    if (!body.email || !body.password || !body.password_confirm) {
      return NextResponse.json({ error: "Email, password, and password confirmation are required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        password_confirm: body.password_confirm,
      }),
    })

    // Parse the response data
    const data = await response.json()

    // If the response is not ok, return the error
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.detail || `Failed to sign up: ${response.status}` },
        { status: response.status },
      )
    }

    // Create the response object
    const apiResponse = NextResponse.json({
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      message: "Signup successful",
    })

    // Set the access token in a cookie
    if (data.access_token) {
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
    }

    // Set the refresh token in a cookie
    if (data.refresh_token) {
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
    }

    return apiResponse
  } catch (error) {
    console.error("Error in signup API route:", error)
    return NextResponse.json({ error: `Failed to sign up: ${(error as Error).message}` }, { status: 500 })
  }
}

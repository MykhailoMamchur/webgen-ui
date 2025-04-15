import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure required fields are provided
    if (!body.email || !body.password || !body.password_confirm) {
      return NextResponse.json({ error: "Email, password, and password confirmation are required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/auth/signup", {
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

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to register: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()

    // Set the auth token in a cookie
    const response2 = NextResponse.json({
      user: data.user,
      token: data.token,
      message: "Registration successful",
    })

    // Set a secure HTTP-only cookie with the token
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
    console.error("Error in signup API route:", error)
    return NextResponse.json({ error: `Failed to register: ${(error as Error).message}` }, { status: 500 })
  }
}

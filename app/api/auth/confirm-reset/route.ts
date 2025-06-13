import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure required fields are provided
    if (!body.token || !body.password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch(`${API_BASE_URL}/auth/confirm-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: body.token,
        password: body.password,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to confirm password reset: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in confirm password reset API route:", error)
    return NextResponse.json(
      { error: `Failed to confirm password reset: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}

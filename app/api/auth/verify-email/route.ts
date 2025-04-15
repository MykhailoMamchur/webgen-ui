// Add a route handler for email verification
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the token from the query parameters
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch(`https://wegenweb.com/api/auth/verify-email?token=${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to verify email: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in verify-email API route:", error)
    return NextResponse.json({ error: `Failed to verify email: ${(error as Error).message}` }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    const accessToken =
      request.cookies.get("access_token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!accessToken) {
      return NextResponse.json({ error: "No access token provided" }, { status: 401 })
    }

    if (!body.new_password) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        new_password: body.new_password,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to change password: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in change password API route:", error)
    return NextResponse.json({ error: `Failed to change password: ${(error as Error).message}` }, { status: 500 })
  }
}

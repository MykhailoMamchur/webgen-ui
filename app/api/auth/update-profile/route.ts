import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the access token from the cookies
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "No access token provided" }, { status: 401 })
    }

    // Get the request body
    const body = await request.json()

    // Forward the request to the API endpoint
    const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to update profile: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in update profile API route:", error)
    return NextResponse.json({ error: `Failed to update profile: ${(error as Error).message}` }, { status: 500 })
  }
}

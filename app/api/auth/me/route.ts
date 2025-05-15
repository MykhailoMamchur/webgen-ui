import { type NextRequest, NextResponse } from "next/server"
import { getApiUrl } from "@/lib/config"

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the cookies or Authorization header
    const accessToken =
      request.cookies.get("access_token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!accessToken) {
      return NextResponse.json({ error: "No access token provided" }, { status: 401 })
    }

    // Forward the request to the API endpoint using the helper function
    const response = await fetch(getApiUrl("/api/auth/me"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to get user data: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()

    // Return the user data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in me API route:", error)
    return NextResponse.json({ error: `Failed to get user data: ${(error as Error).message}` }, { status: 500 })
  }
}

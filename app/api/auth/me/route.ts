// Add a new route handler for /api/auth/me
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("Using token:", accessToken.substring(0, 20) + "...")

    // Forward the request to the API endpoint with explicit Authorization header
    // Using JWT with HS256 algorithm in the Authorization header
    const response = await fetch("https://wegenweb.com/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`, // JWT token with HS256 algorithm
      },
      credentials: "include", // Include cookies in the request
    })

    // If the response is not ok, return a more specific error
    if (!response.ok) {
      // Try to parse the error response
      try {
        const errorData = await response.json()
        return NextResponse.json(
          { error: errorData.message || errorData.detail || `Failed to get user data: ${response.status}` },
          { status: response.status },
        )
      } catch (e) {
        // If we can't parse the response as JSON, return a generic error
        return NextResponse.json({ error: `Failed to get user data: ${response.status}` }, { status: response.status })
      }
    }

    // Parse the response data
    const data = await response.json()

    // Return the user data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in auth/me API route:", error)
    return NextResponse.json({ error: `Failed to get user data: ${(error as Error).message}` }, { status: 500 })
  }
}

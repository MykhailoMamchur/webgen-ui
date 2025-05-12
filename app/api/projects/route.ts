import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from the request cookies
    const token = request.cookies.get("access_token")?.value

    // If no token, return an empty projects array instead of an error
    if (!token) {
      return NextResponse.json({ projects: [], authenticated: false })
    }

    // Update the API endpoint to use the environment-specific base URL
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Ensure proper format with space after Bearer
      },
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Return the response directly
    const data = await response.json()
    return NextResponse.json({ ...data, authenticated: true })
  } catch (error) {
    console.error("Error in projects API route:", error)
    // Return empty projects array instead of error status
    return NextResponse.json(
      { error: `Failed to fetch projects: ${(error as Error).message}`, projects: [], authenticated: false },
      { status: 200 }, // Return 200 instead of 500 to handle gracefully
    )
  }
}

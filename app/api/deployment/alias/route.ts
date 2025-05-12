import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Update the request body to use project_id instead of project_name
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Ensure project_id is provided
    if (!body.project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint using the environment-specific base URL
    const response = await fetch(`${API_BASE_URL}/deployment/alias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        project_id: body.project_id,
      }),
    })

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`External API error (${response.status}):`, errorText)

      // Try to parse as JSON, but handle text responses too
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { error: errorText || `External API returned ${response.status}` }
      }

      return NextResponse.json(errorData, { status: response.status })
    }

    // Return the response from the external API
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in deployment alias API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function GET(request: NextRequest, { params }: { params: { project_id: string } }) {
  try {
    // Get project_id from the URL parameters
    const projectId = params.project_id

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Validate the project ID
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Forward the request to the external API using the environment-specific base URL
    const response = await fetch(`${API_BASE_URL}/deployment?project_id=${projectId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })

    // Check if the response is successful
    if (!response.ok) {
      if (response.status === 404) {
        // No deployment found - this is expected for new projects
        return NextResponse.json({ error: "No deployment found" }, { status: 404 })
      }

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
    console.error("Error in deployment GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

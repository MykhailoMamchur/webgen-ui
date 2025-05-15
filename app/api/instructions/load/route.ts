import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Update the request body to use project_id instead of project_name
    // Ensure project_id is provided
    if (!body.project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint using the environment-specific base URL
    const response = await fetch(`${API_BASE_URL}/instructions/load`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // Ensure proper format with space
      },
      body: JSON.stringify({
        project_id: body.project_id,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Parse the response data
    const data = await response.json()

    // Return the instructions data
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load instructions: ${(error as Error).message}`, instructions: "" },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Update the request body to use project_id instead of project_name
    // Ensure project_id is used consistently
    const requestBody = {
      project_id: body.project_id || body.project_name || body.directory, // Support all formats for backward compatibility
    }

    // Ensure project_id is provided
    if (!requestBody.project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Update the API endpoint to use wegenweb.com/api
    const response = await fetch("https://wegenweb.com/api/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // Ensure proper format with space
      },
      body: JSON.stringify(requestBody),
    })

    // Parse the JSON response
    const data = await response.json()

    // If the API returns an error status, pass it through
    if (data.status === "error") {
      return NextResponse.json(data, { status: 400 })
    }

    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    // Return the response
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in start API route:", error)
    return NextResponse.json({ error: `Failed to start server: ${(error as Error).message}` }, { status: 500 })
  }
}

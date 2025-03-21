import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure project_name is used consistently
    const requestBody = {
      project_name: body.project_name || body.directory, // Support both formats
    }

    // Ensure project_name is provided
    if (!requestBody.project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Forward the request to the new API endpoint
    const response = await fetch("/api/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Return the response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in start API route:", error)
    return NextResponse.json({ error: `Failed to start server: ${(error as Error).message}` }, { status: 500 })
  }
}


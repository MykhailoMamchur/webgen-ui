import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure project_name is provided
    if (!body.project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Forward the request to the new API endpoint with the project name in the URL
    const response = await fetch(`https://wegenweb.com/api/stop/${body.project_name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      // If the response is JSON, parse it
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // If the response is not JSON, return a success message
      if (response.ok) {
        return NextResponse.json({ status: "success", message: "Project stopped successfully" })
      } else {
        const errorText = await response.text()
        throw new Error(`API responded with status ${response.status}`)
      }
    }
  } catch (error) {
    console.error("Error in stop API route:", error)
    return NextResponse.json({ error: `Failed to stop server: ${(error as Error).message}` }, { status: 500 })
  }
}


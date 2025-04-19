// Create a new file for the project creation API route
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request cookies
    const token = request.cookies.get("access_token")?.value

    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { project_name } = body

    if (!project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Forward the request to the backend API with authentication
    const response = await fetch("https://wegenweb.com/api/projects/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the auth token
      },
      body: JSON.stringify({ project_name }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Return the response from the backend
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in project creation API route:", error)
    return NextResponse.json({ error: `Failed to create project: ${(error as Error).message}` }, { status: 500 })
  }
}

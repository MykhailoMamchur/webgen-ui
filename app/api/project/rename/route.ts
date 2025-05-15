import { type NextRequest, NextResponse } from "next/server"
import { getApiUrl } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Update the request body to use project_id instead of project_name
    // Ensure project_id and new_project_name are provided
    if (!body.project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    if (!body.new_project_name) {
      return NextResponse.json({ error: "New project name is required" }, { status: 400 })
    }

    // Validate the new project name (no spaces, etc.)
    if (/\s/.test(body.new_project_name)) {
      return NextResponse.json({ error: "Project name cannot contain spaces. Use hyphens instead." }, { status: 400 })
    }

    // Forward the request to the API endpoint using the helper function
    const response = await fetch(getApiUrl("/api/project/rename"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        project_id: body.project_id,
        new_project_name: body.new_project_name,
      }),
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      // If the response is JSON, parse it
      const data = await response.json()

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || `Failed to rename project: ${response.status}`)
      }

      return NextResponse.json(data)
    } else {
      // If the response is not JSON, return a success message if the response is ok
      if (response.ok) {
        return NextResponse.json({ status: "success", message: "Project renamed successfully" })
      } else {
        const errorText = await response.text()
        throw new Error(`API responded with status ${response.status}: ${errorText}`)
      }
    }
  } catch (error) {
    console.error("Error in project/rename API route:", error)
    return NextResponse.json({ error: `Failed to rename project: ${(error as Error).message}` }, { status: 500 })
  }
}

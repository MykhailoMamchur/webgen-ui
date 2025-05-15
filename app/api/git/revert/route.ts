import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Update the request body to use project_id instead of project_name
    // Ensure project_id and commit_hash are provided
    if (!body.project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    if (!body.commit_hash) {
      return NextResponse.json({ error: "Commit hash is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint using the environment-specific base URL
    const response = await fetch(`${API_BASE_URL}/git/revert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // Ensure proper format with space
      },
      body: JSON.stringify({
        project_id: body.project_id,
        commit_hash: body.commit_hash,
      }),
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      // If the response is JSON, parse it
      const data = await response.json()

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || `Failed to revert to checkpoint: ${response.status}`)
      }

      return NextResponse.json(data)
    } else {
      // If the response is not JSON, return a success message if the response is ok
      if (response.ok) {
        return NextResponse.json({ status: "success", message: "Checkpoint restored successfully" })
      } else {
        const errorText = await response.text()
        throw new Error(`API responded with status ${response.status}: ${errorText}`)
      }
    }
  } catch (error) {
    console.error("Error in git/revert API route:", error)
    return NextResponse.json({ error: `Failed to restore checkpoint: ${(error as Error).message}` }, { status: 500 })
  }
}

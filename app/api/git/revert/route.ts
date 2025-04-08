import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure project_name and commit_hash are provided
    if (!body.project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    if (!body.commit_hash) {
      return NextResponse.json({ error: "Commit hash is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/git/revert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_name: body.project_name,
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

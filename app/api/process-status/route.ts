import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure project_name is provided
    if (!body.project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/projects", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Parse the response data
    const data = await response.json()

    // Find the project with the matching name
    if (data.projects && Array.isArray(data.projects)) {
      const project = data.projects.find((p: any) => p.name === body.project_name)

      if (project) {
        // Return the project status in the expected format
        return NextResponse.json({
          status: project.status || "stopped",
          pid: project.pid,
          port: project.port,
          message: project.status === "running" ? "Project is running" : "Project is stopped",
        })
      }
    }

    // If project not found, return a default status
    return NextResponse.json({
      status: "stopped",
      message: "Project not found",
    })
  } catch (error) {
    console.error("Error in process-status API route:", error)
    return NextResponse.json(
      { error: `Failed to get process status: ${(error as Error).message}`, status: "stopped" },
      { status: 500 },
    )
  }
}


import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { projectName: string } }) {
  try {
    const projectName = params.projectName

    if (!projectName) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Forward the request to the new API endpoint
    const response = await fetch(`/api/process-output/${projectName}`, {
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

    // Return the response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in process-output API route:", error)
    return NextResponse.json({ error: `Failed to get process output: ${(error as Error).message}` }, { status: 500 })
  }
}


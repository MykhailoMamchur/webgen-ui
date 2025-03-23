import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Ensure project_name and message are provided
    if (!body.project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    if (!body.message || !body.message.role || !body.message.content) {
      return NextResponse.json({ error: "Valid message object is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/chat/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_name: body.project_name,
        message: body.message,
      }),
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
    console.error("Error in chat/add API route:", error)
    return NextResponse.json({ error: `Failed to add message: ${(error as Error).message}` }, { status: 500 })
  }
}


import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Ensure project_name and message are provided
    if (!body.project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Update the error check to explicitly validate the role property
    if (
      !body.message ||
      !body.message.role ||
      !body.message.content ||
      (body.message.role !== "user" && body.message.role !== "assistant" && body.message.role !== "git")
    ) {
      return NextResponse.json(
        {
          error: "Valid message object is required with role (user, assistant, or git) and content",
        },
        { status: 400 },
      )
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/chat/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // Ensure proper format
      },
      // Make sure we're explicitly passing all properties in the request body
      body: JSON.stringify({
        project_name: body.project_name,
        message: {
          role: body.message.role,
          content: body.message.content,
          ...(body.message.action && { action: body.message.action }),
          ...(body.message.hash && { hash: body.message.hash }),
        },
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

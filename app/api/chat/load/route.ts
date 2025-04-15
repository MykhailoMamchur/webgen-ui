import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Ensure project_name is provided
    if (!body.project_name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/chat/load", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        project_name: body.project_name,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Parse the response data
    const data = await response.json()

    // Simply pass through the messages from the server
    // The server will now include git messages with role, content, action, and hash properties
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load messages: ${(error as Error).message}`, messages: [] },
      { status: 500 },
    )
  }
}

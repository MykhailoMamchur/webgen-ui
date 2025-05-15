import { type NextRequest, NextResponse } from "next/server"
import { getApiUrl } from "@/lib/config"

// Set a longer timeout for the API route
export const maxDuration = 3600 // 60 minutes

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Change directory to project_name in the request
    const requestBody = {
      ...body,
      project_name: body.project_name || body.directory, // Support both formats
    }

    // Remove directory if it exists to avoid confusion
    if (requestBody.directory) {
      delete requestBody.directory
    }

    // Forward the request to the edit API using the helper function
    const response = await fetch(getApiUrl("/api/edit"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(requestBody),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Create a new readable stream
    const stream = response.body

    // If there's no stream, throw an error
    if (!stream) {
      throw new Error("No response stream from API")
    }

    // Return the stream as the response with appropriate headers
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering for Nginx
      },
    })
  } catch (error) {
    console.error("Error in generate API route:", error)
    return NextResponse.json({ error: `Failed to generate content: ${(error as Error).message}` }, { status: 500 })
  }
}

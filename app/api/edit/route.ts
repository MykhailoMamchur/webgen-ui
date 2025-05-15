import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

// Set a longer timeout for the API route
export const maxDuration = 3600 // 60 minutes

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Update the request body to use project_id instead of project_name
    const requestBody = {
      ...body,
      project_id: body.project_id || body.project_name || body.directory, // Support all formats for backward compatibility
    }

    // Remove project_name if it exists to avoid confusion
    if (requestBody.project_name) {
      delete requestBody.project_name
    }

    // Remove directory if it exists to avoid confusion
    if (requestBody.directory) {
      delete requestBody.directory
    }

    // Create an AbortController to handle client disconnections
    const controller = new AbortController()
    const { signal } = controller

    // Set up a handler for request cancellation
    request.signal.addEventListener("abort", () => {
      // Abort the fetch to the backend when the client aborts
      controller.abort()
    })

    // Update the API endpoint to use the environment-specific base URL
    const response = await fetch(`${API_BASE_URL}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // Ensure proper format with space
      },
      body: JSON.stringify(requestBody),
      signal, // Pass the abort signal to the fetch request
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Get the response stream
    const stream = response.body

    // If there's no stream, throw an error
    if (!stream) {
      throw new Error("No response stream from API")
    }

    // Return the stream directly as the response with appropriate headers
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
    console.error("Error in edit API route:", error)
    return NextResponse.json({ error: `Failed to edit content: ${(error as Error).message}` }, { status: 500 })
  }
}

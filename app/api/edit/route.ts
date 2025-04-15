import { type NextRequest, NextResponse } from "next/server"

// Set a longer timeout for the API route
export const maxDuration = 3600 // 60 minutes

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    // Ensure project_name is used consistently
    const requestBody = {
      ...body,
      project_name: body.project_name || body.directory, // Support both formats
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

    // Update the API endpoint to use wegenweb.com/api
    const response = await fetch("https://wegenweb.com/api/edit", {
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

    // Create a new readable stream
    const stream = response.body

    // If there's no stream, throw an error
    if (!stream) {
      throw new Error("No response stream from API")
    }

    // Create a TransformStream to keep the connection alive
    const keepAliveStream = new TransformStream({
      start(controller) {
        // Send a comment every 15 seconds to keep the connection alive
        const interval = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode("\n<!-- keep-alive -->\n"))
          } catch (e) {
            clearInterval(interval)
          }
        }, 15000)

        // Clean up the interval when the request is aborted
        request.signal.addEventListener("abort", () => {
          clearInterval(interval)
        })
      },
      transform(chunk, controller) {
        controller.enqueue(chunk)
      },
    })

    // Pipe the response through the keep-alive stream
    const transformedStream = stream.pipeThrough(keepAliveStream)

    // Return the stream as the response with appropriate headers
    return new NextResponse(transformedStream, {
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

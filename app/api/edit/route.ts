import type { NextRequest } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

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

    // Handle non-200 responses properly
    if (!response.ok) {
      // For error responses, preserve the original status code and body
      const contentType = response.headers.get("content-type") || ""

      // If it's JSON, pass it through as JSON
      if (contentType.includes("application/json")) {
        const errorData = await response.json()
        return Response.json(errorData, { status: response.status })
      }

      // Otherwise, pass through as text
      const errorText = await response.text()
      return new Response(errorText, {
        status: response.status,
        headers: {
          "Content-Type": contentType || "text/plain",
        },
      })
    }

    // Get the response stream
    const stream = response.body

    // If there's no stream, throw an error
    if (!stream) {
      throw new Error("No response stream from API")
    }

    // Create a custom readable stream that ensures proper streaming
    const readableStream = new ReadableStream({
      start(controller) {
        const reader = stream.getReader()

        function pump(): Promise<void> {
          return reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close()
                return
              }

              // Enqueue the chunk immediately
              controller.enqueue(value)
              return pump()
            })
            .catch((error) => {
              controller.error(error)
            })
        }

        return pump()
      },

      cancel() {
        // Clean up when the stream is cancelled
        controller.abort()
      },
    })

    // Return the stream with proper headers for streaming
    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
        Connection: "keep-alive",
        // Force streaming by not setting Content-Length
      },
    })
  } catch (error) {
    console.error("Error in edit API route:", error)
    return Response.json({ error: `Failed to edit content: ${(error as Error).message}` }, { status: 500 })
  }
}

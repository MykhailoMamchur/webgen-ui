import type { NextRequest } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

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
      project_id: body.project_id || body.project_name || body.directory,
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
      controller.abort()
    })

    console.log(`Making request to: ${API_BASE_URL}/edit`)

    // Fetch from backend with streaming-optimized headers
    const response = await fetch(`${API_BASE_URL}/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/plain",
        "Cache-Control": "no-cache",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(requestBody),
      signal,
      // Important: don't let fetch buffer the response
      cache: 'no-store',
    })

    console.log(`Backend response status: ${response.status}`)
    console.log(`Backend response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Backend error: ${response.status} - ${errorText}`)
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Check if the response is actually streaming
    const contentType = response.headers.get('content-type')
    console.log(`Content-Type from backend: ${contentType}`)

    // Get the response stream
    const stream = response.body

    if (!stream) {
      throw new Error("No response stream from API")
    }

    // Create headers for the streaming response
    const responseHeaders = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
    })

    // CRITICAL FIX: Use a TransformStream for better streaming control
    const { readable, writable } = new TransformStream()
    
    // Start the streaming process
    const reader = stream.getReader()
    const writer = writable.getWriter()

    // Pump data through immediately
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('Stream completed')
            await writer.close()
            break
          }

          console.log(`Streaming chunk of size: ${value?.length || 0}`)
          await writer.write(value)
        }
      } catch (error) {
        console.error('Streaming error:', error)
        await writer.abort(error)
      } finally {
        reader.releaseLock()
        writer.releaseLock()
      }
    }

    // Start pumping data (don't await this, let it run in background)
    pump().catch(console.error)

    // Return the readable stream immediately
    return new Response(readable, {
      status: 200,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error("Error in edit API route:", error)
    return Response.json(
      { error: `Failed to edit content: ${(error as Error).message}` }, 
      { status: 500 }
    )
  }
}
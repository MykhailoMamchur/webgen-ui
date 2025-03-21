import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Forward the request to the new API endpoint
    const response = await fetch("/api/stop-all", {
      method: "POST",
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
    console.error("Error in stop-all API route:", error)
    return NextResponse.json({ error: `Failed to stop all servers: ${(error as Error).message}` }, { status: 500 })
  }
}


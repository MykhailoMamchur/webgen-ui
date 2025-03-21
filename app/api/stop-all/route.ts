import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Forward the request to the new API endpoint
    const response = await fetch("https://wegenweb.com/api/stop-all", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      // If the response is JSON, parse it
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // If the response is not JSON, return a success message
      if (response.ok) {
        return NextResponse.json({ status: "success", message: "All projects stopped successfully" })
      } else {
        const errorText = await response.text()
        throw new Error(`API responded with status ${response.status}`)
      }
    }
  } catch (error) {
    console.error("Error in stop-all API route:", error)
    return NextResponse.json({ error: `Failed to stop all servers: ${(error as Error).message}` }, { status: 500 })
  }
}


import { type NextRequest, NextResponse } from "next/server"
import { getApiUrl } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Ensure required fields are provided
    if (!body.id || !body.title || !body.content) {
      return NextResponse.json({ error: "ID, title, and content are required" }, { status: 400 })
    }

    // Forward the request to the API endpoint using the helper function
    const response = await fetch(getApiUrl("/api/prompts/update"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        id: body.id,
        title: body.title,
        content: body.content,
        is_active: body.is_active || false,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Parse the response data
    const data = await response.json()

    // Return the updated prompt data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in prompts/update API route:", error)
    return NextResponse.json({ error: `Failed to update prompt: ${(error as Error).message}` }, { status: 500 })
  }
}

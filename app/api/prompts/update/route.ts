import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: Request) {
  try {
    // Get the auth token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      console.error("No authentication token found in cookies")
      return NextResponse.json({ status: "error", error: "Authentication required" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { prompt_id, prompt_name, prompt_text } = body

    if (!prompt_id || !prompt_name || !prompt_text) {
      return NextResponse.json({ status: "error", error: "Prompt ID, name, and text are required" }, { status: 400 })
    }

    console.log("Updating prompt with token:", token.substring(0, 10) + "...")
    console.log("Request body:", { prompt_id, prompt_name, prompt_text })

    // Forward the request to the backend API with the auth token using the environment-specific base URL
    const response = await fetch(`${API_BASE_URL}/prompts/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt_id,
        prompt_name,
        prompt_text,
      }),
    })

    console.log("API response status:", response.status)

    // Log the response body for debugging
    const responseText = await response.text()
    console.log("API response body:", responseText)

    // Parse the response as JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Error parsing JSON response:", e)
      return NextResponse.json({ status: "error", error: "Invalid response from server" }, { status: 500 })
    }

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", error: data.error || "Failed to update prompt" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating prompt:", error)
    return NextResponse.json({ status: "error", error: "Internal server error" }, { status: 500 })
  }
}

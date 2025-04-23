import { NextResponse } from "next/server"
import { getAuthToken } from "@/lib/auth"

// Use a hardcoded API base URL
const API_BASE_URL = "https://wegenweb.com/api"

export async function POST(request: Request) {
  try {
    // Get the auth token
    const token = getAuthToken()

    if (!token) {
      return NextResponse.json({ status: "error", error: "Authentication required" }, { status: 401 })
    }

    console.log("Getting all prompts with token:", token)

    // Forward the request to the backend API with the auth token
    const response = await fetch(`${API_BASE_URL}/prompts/get_all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
        { status: "error", error: data.error || "Failed to get prompts" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting prompts:", error)
    return NextResponse.json({ status: "error", error: "Internal server error" }, { status: 500 })
  }
}

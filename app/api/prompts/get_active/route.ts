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

    // Forward the request to the backend API with the auth token
    const response = await fetch(`${API_BASE_URL}/prompts/get_active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", error: data.error || "Failed to get active prompt" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting active prompt:", error)
    return NextResponse.json({ status: "error", error: "Internal server error" }, { status: 500 })
  }
}

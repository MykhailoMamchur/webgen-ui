import { type NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const apiBaseUrl = getApiBaseUrl()
    const response = await fetch(`${apiBaseUrl}/user/tier`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
      }

      const errorText = await response.text()
      console.error("Backend API error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to fetch tier data" }, { status: response.status })
    }

    const tierData = await response.json()
    return NextResponse.json(tierData)
  } catch (error) {
    console.error("Error fetching user tier data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

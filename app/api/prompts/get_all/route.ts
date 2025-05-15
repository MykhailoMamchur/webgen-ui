import { type NextRequest, NextResponse } from "next/server"
import { getApiUrl } from "@/lib/config"

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Forward the request to the API endpoint using the helper function
    const response = await fetch(getApiUrl("/api/prompts/get_all"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Parse the response data
    const data = await response.json()

    // Return the prompts data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in prompts/get_all API route:", error)
    return NextResponse.json({ error: `Failed to get prompts: ${(error as Error).message}` }, { status: 500 })
  }
}

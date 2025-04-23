import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the refresh token from the request cookies
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      console.error("No refresh token found in cookies")
      return NextResponse.json({ error: "No refresh token found" }, { status: 401 })
    }

    console.log("Attempting to refresh token with refresh_token:", refreshToken.substring(0, 10) + "...")

    // Forward the request to the API endpoint
    const response = await fetch("https://wegenweb.com/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json()
      console.error("API refresh token failed:", errorData)
      return NextResponse.json(
        { error: errorData.message || errorData.detail || `Failed to refresh token: ${response.status}` },
        { status: response.status },
      )
    }

    // Parse the response data
    const data = await response.json()
    console.log(
      "Token refreshed successfully, new token expires in:",
      data.access_token ? getTokenExpiry(data.access_token) : "unknown",
    )

    // Create the response object
    const apiResponse = NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      message: "Token refreshed successfully",
    })

    // Set the access token in a cookie
    apiResponse.cookies.set({
      name: "access_token",
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
    })

    // Set the refresh token in a cookie
    apiResponse.cookies.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
    })

    return apiResponse
  } catch (error) {
    console.error("Error in refresh token API route:", error)
    return NextResponse.json({ error: `Failed to refresh token: ${(error as Error).message}` }, { status: 500 })
  }
}

// Helper function to get token expiry time
function getTokenExpiry(token: string): string {
  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) return "invalid token"

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const { exp } = JSON.parse(jsonPayload)
    if (!exp) return "no expiry"

    const expiryDate = new Date(exp * 1000)
    const now = new Date()
    const diffMinutes = Math.round((expiryDate.getTime() - now.getTime()) / (60 * 1000))

    return `${diffMinutes} minutes`
  } catch (error) {
    return "error parsing token"
  }
}

// Add a new route handler for /api/auth/me
import { type NextRequest, NextResponse } from "next/server"

// Function to check if a JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    // Extract the payload from the JWT token
    const base64Url = token.split(".")[1]
    if (!base64Url) return true

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const { exp } = JSON.parse(jsonPayload)

    // Check if the token is expired
    if (!exp) return false
    const currentTime = Math.floor(Date.now() / 1000)
    return currentTime >= exp
  } catch (error) {
    console.error("Error checking token expiration:", error)
    return true // If we can't parse the token, assume it's expired
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the request cookies
    const accessToken = request.cookies.get("access_token")?.value
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      // If we have a refresh token, try to refresh
      if (refreshToken) {
        try {
          // Try to refresh the token
          const refreshResponse = await fetch("https://wegenweb.com/api/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh_token: refreshToken,
            }),
          })

          if (!refreshResponse.ok) {
            return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 })
          }

          // Get the new tokens
          const refreshData = await refreshResponse.json()
          const newAccessToken = refreshData.access_token
          const newRefreshToken = refreshData.refresh_token

          // Create a response object to set cookies
          const response = NextResponse.next()

          // Set the new access token cookie
          response.cookies.set({
            name: "access_token",
            value: newAccessToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60, // 1 hour
            path: "/",
            domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
          })

          // Set the new refresh token cookie
          response.cookies.set({
            name: "refresh_token",
            value: newRefreshToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            domain: process.env.NODE_ENV === "production" ? ".wegenweb.com" : undefined,
          })

          // Now use the new access token to get user data
          const userResponse = await fetch("https://wegenweb.com/api/auth/me", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
            },
          })

          if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user data after token refresh" }, { status: 401 })
          }

          const userData = await userResponse.json()

          // Create the final response with user data and updated cookies
          const finalResponse = NextResponse.json(userData)

          // Copy cookies from the intermediate response
          response.cookies.getAll().forEach((cookie) => {
            finalResponse.cookies.set(cookie)
          })

          return finalResponse
        } catch (error) {
          console.error("Error refreshing token:", error)
          return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 })
        }
      } else {
        return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 })
      }
    }

    // Forward the request to the API endpoint with explicit Authorization header
    // Ensure proper Bearer format with space after "Bearer"
    const response = await fetch("https://wegenweb.com/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Explicitly set the Authorization header with space after Bearer
      },
    })

    // If the response is not ok, return a more specific error
    if (!response.ok) {
      // Try to parse the error response
      try {
        const errorData = await response.json()
        return NextResponse.json(
          { error: errorData.message || errorData.detail || `Failed to get user data: ${response.status}` },
          { status: response.status },
        )
      } catch (e) {
        // If we can't parse the response as JSON, return a generic error
        return NextResponse.json({ error: `Failed to get user data: ${response.status}` }, { status: response.status })
      }
    }

    // Parse the response data
    const data = await response.json()

    // Return the user data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in auth/me API route:", error)
    return NextResponse.json({ error: `Failed to get user data: ${(error as Error).message}` }, { status: 500 })
  }
}

// Authentication API utilities

// Base URL for the wegenweb API
const API_BASE_URL = "https://wegenweb.com/api"

// Helper function to get the auth token from cookies
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    // Try to get from cookie first
    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

    return cookies["access_token"] || null
  }
  return null
}

// Helper function to check if a JWT token is expired
export const isTokenExpired = (token: string, bufferSeconds = 0): boolean => {
  if (!token) return true

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

    // Check if the token is expired or will expire within the buffer time
    if (!exp) return false
    const currentTime = Math.floor(Date.now() / 1000)
    return currentTime >= exp - bufferSeconds // Subtract buffer time from expiration
  } catch (error) {
    console.error("Error checking token expiration:", error)
    return true // If we can't parse the token, assume it's expired
  }
}

// Helper function to make authenticated API requests with token refresh
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`

  // Check if token is expired and try to refresh it
  if (token && isTokenExpired(token)) {
    try {
      await refreshToken()
      // Get the new token after refresh
      token = getAuthToken()
    } catch (error) {
      console.error("Failed to refresh token:", error)
      // If refresh fails, clear the token and throw an error
      throw new Error("Authentication expired. Please log in again.")
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // Ensure proper Bearer format with space
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Include cookies in cross-origin requests
    })

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401) {
      try {
        await refreshToken()
        // Get the new token after refresh
        const newToken = getAuthToken()

        // If token refresh was successful, retry the request
        if (newToken) {
          const newHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
            ...options.headers,
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: newHeaders,
            credentials: "include",
          })

          // Handle the retry response
          return handleResponse(retryResponse)
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError)
        throw new Error("Authentication expired. Please log in again.")
      }
    }

    // Handle normal response
    return handleResponse(response)
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

// Helper function to handle API responses
async function handleResponse(response: Response) {
  // Handle non-JSON responses
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json()

    // If the response is not ok, throw an error with the response data
    if (!response.ok) {
      throw new Error(data.message || data.detail || "An error occurred")
    }

    return data
  }

  // For non-JSON responses
  if (!response.ok) {
    throw new Error("An error occurred")
  }

  return response
}

// Login user
export async function loginUser(email: string, password: string) {
  // Use the local API route which will set the cookie properly
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include", // Include cookies in the request
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Login failed")
  }

  const data = await response.json()
  return data
}

// Register user - Updated to match backend expectations
export async function registerUser(email: string, password: string, passwordConfirm: string) {
  // Use the local API route which will set the cookie properly
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      password_confirm: passwordConfirm,
    }),
    credentials: "include", // Include cookies in the request
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Registration failed")
  }

  const data = await response.json()
  return data
}

// Logout user
export async function logoutUser() {
  // Use the local API route which will clear the cookie properly
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include", // Include cookies in the request
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Logout failed")
  }

  return await response.json()
}

// Reset password
export async function resetPassword(email: string) {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    credentials: "include", // Include cookies in the request
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to reset password")
  }

  return await response.json()
}

// Get current user
export async function getCurrentUser() {
  // Use our local API route instead of direct fetch
  const token = getAuthToken()
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include", // Include cookies in the request
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Authentication failed")
  }

  return await response.json()
}

// Refresh token
export async function refreshToken() {
  try {
    console.log("Attempting to refresh token...")
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Include cookies in the request
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Token refresh failed:", errorData)
      throw new Error(errorData.error || errorData.message || "Failed to refresh token")
    }

    const data = await response.json()
    console.log("Token refreshed successfully")
    return data
  } catch (error) {
    console.error("Failed to refresh token:", error)
    throw error
  }
}

// Verify email
export async function verifyEmail(token: string) {
  const response = await fetch(`/api/auth/verify-email?token=${token}`, {
    method: "GET",
    credentials: "include", // Include cookies in the request
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to verify email")
  }

  return await response.json()
}

// Update user profile
export async function updateUserProfile(userData: {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}) {
  const response = await fetch("/api/auth/update-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials: "include", // Include cookies in the request
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to update profile")
  }

  return await response.json()
}

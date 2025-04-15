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

// Helper function to make authenticated API requests
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
    credentials: "include", // Include cookies in cross-origin requests
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

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
  // Get the auth token directly
  const token = getAuthToken()

  if (!token) {
    throw new Error("Authentication required")
  }

  const url = `${API_BASE_URL}/auth/me`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include", // Include cookies in cross-origin requests
  })

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

// Refresh token
export async function refreshToken() {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Include cookies in the request
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    return await response.json()
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

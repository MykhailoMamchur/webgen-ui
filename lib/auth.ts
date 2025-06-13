import { apiPost, apiGet } from "./api-client"

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

    const token = cookies["access_token"] || null
    console.log(`Auth: Getting token from cookies, exists: ${!!token}`)
    if (token) {
      console.log(`Auth: Token preview: ${token.substring(0, 50)}...`)
    }
    return token
  }
  return null
}

export const getRefreshToken = (): string | null => {
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

    const token = cookies["refresh_token"] || null
    console.log(`Auth: Getting refresh_token from cookies, exists: ${!!token}`)
    if (token) {
      console.log(`Auth: refresh_token preview: ${token.substring(0, 50)}...`)
    }
    return token
  }
  return null
}

// Helper function to check if a JWT token is expired
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true

  try {
    console.log(`Auth: Checking if token is expired: ${token.substring(0, 20)}...`)

    // Extract the payload from the JWT token
    const parts = token.split(".")
    if (parts.length !== 3) {
      console.log("Auth: Token doesn't have 3 parts, considering expired")
      return true
    }

    const base64Url = parts[1]
    if (!base64Url) {
      console.log("Auth: No payload part found, considering expired")
      return true
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const payload = JSON.parse(jsonPayload)
    console.log(`Auth: Token payload parsed, exp: ${payload.exp}`)

    const { exp } = payload

    // Check if the token is expired
    if (!exp) {
      console.log("Auth: No expiration in token, considering valid")
      return false
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = currentTime >= exp
    const timeUntilExpiry = exp - currentTime

    console.log(
      `Auth: Current time: ${currentTime}, Token exp: ${exp}, Time until expiry: ${timeUntilExpiry}s, Is expired: ${isExpired}`,
    )

    return isExpired
  } catch (error) {
    console.error("Auth: Error checking token expiration:", error)
    return true // If we can't parse the token, assume it's expired
  }
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
  console.log("Auth: Login successful, tokens received")
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
  console.log("Auth: Registration successful, tokens received")
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

  console.log("Auth: Logout successful")
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

// Confirm password reset
export async function confirmPasswordReset(token: string, password: string) {
  const response = await fetch("/api/auth/confirm-reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
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
  return apiGet("/api/auth/me")
}

// Refresh token
export async function refreshToken() {
  try {
    console.log("Auth: Attempting to refresh token...")
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Include cookies in the request
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: getRefreshToken() }), // Send current token for validation
    })

    console.log(`Auth: Refresh response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Auth: Token refresh failed:", errorData)
      throw new Error(errorData.error || errorData.message || "Failed to refresh token")
    }

    const data = await response.json()
    console.log("Auth: Token refreshed successfully")
    return data
  } catch (error) {
    console.error("Auth: Failed to refresh token:", error)
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
  return apiPost("/api/auth/update-profile", userData)
}

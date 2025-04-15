// Authentication API utilities

// Base URL for the wegenweb API
const API_BASE_URL = "https://wegenweb.com/api"

// Helper function to get the auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
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
  const data = await authFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })

  return data
}

// Register user - Updated to match backend expectations
export async function registerUser(email: string, password: string, passwordConfirm: string) {
  const data = await authFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      password_confirm: passwordConfirm,
    }),
  })

  return data
}

// Logout user
export async function logoutUser() {
  return authFetch("/auth/logout", {
    method: "POST",
  })
}

// Reset password
export async function resetPassword(email: string) {
  return authFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

// Get current user
export async function getCurrentUser() {
  return authFetch("/auth/me")
}

// Refresh token
export async function refreshToken() {
  const data = await authFetch("/auth/refresh")

  // Update token in localStorage if a new one is returned
  if (data.token) {
    localStorage.setItem("auth_token", data.token)
  }

  return data
}

// Verify email
export async function verifyEmail(token: string) {
  return authFetch(`/auth/verify-email?token=${token}`)
}

// Update user profile
export async function updateUserProfile(userData: {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}) {
  return authFetch("/auth/update-profile", {
    method: "POST",
    body: JSON.stringify(userData),
  })
}

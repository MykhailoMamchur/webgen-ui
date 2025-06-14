// Simplified auth functions - all token management handled by middleware
export async function loginUser(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Login failed")
  }

  return await response.json()
}

export async function registerUser(email: string, password: string, passwordConfirm: string) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, password_confirm: passwordConfirm }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Registration failed")
  }

  return await response.json()
}

export async function logoutUser() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Logout failed")
  }

  return await response.json()
}

export async function resetPassword(email: string) {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to reset password")
  }

  return await response.json()
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to get user data")
  }

  return await response.json()
}

export async function updateUserProfile(userData: {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}) {
  const response = await fetch("/api/auth/update-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to update profile")
  }

  return await response.json()
}

// Legacy functions - no longer needed but kept for compatibility
export const getAuthToken = () => null
export const getRefreshToken = () => null
export const isTokenExpired = () => true
export const refreshToken = async () => ({ success: true })
export const confirmPasswordReset = async (token: string, password: string) => {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_password: password }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to reset password")
  }

  return await response.json()
}
export const verifyEmail = async (token: string) => {
  const response = await fetch(`/api/auth/verify-email?token=${token}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || errorData.message || "Failed to verify email")
  }

  return await response.json()
}

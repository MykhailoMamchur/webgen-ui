import { createClient } from "@supabase/supabase-js"
import { API_BASE_URL } from "./config"

// Extract the Supabase URL and anon key from environment or config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ayhyqgzeiuyaymtorteg.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHlxZ3plaXV5YXltdG9ydGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTYxODIsImV4cCI6MjA2MDIzMjE4Mn0.bCpMxdkJS70InbMcjFUB_JCmawNaJ8QYvyu3EVZ_eUg"

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Helper function to get the current session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Error getting session:", error)
    return null
  }
  return data.session
}

// Helper function to get the current user
export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error("Error getting user:", error)
    return null
  }
  return data.user
}

// Helper function to sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

// Helper function to sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
  return true
}

// Helper function to reset password
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password/update`,
  })

  if (error) {
    throw error
  }

  return data
}

// Helper function to update password
export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }

  return data
}

// Helper function to update user profile
export const updateProfile = async (updates: { email?: string; data?: any }) => {
  const { data, error } = await supabase.auth.updateUser(updates)

  if (error) {
    throw error
  }

  return data
}

// Helper function to get access token
export const getAccessToken = async () => {
  const session = await getSession()
  return session?.access_token || null
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const session = await getSession()
  return !!session
}

// Helper function to refresh token
export const refreshAccessToken = async () => {
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    console.error("Error refreshing token:", error)
    return null
  }

  return data.session?.access_token || null
}

// Helper function to make authenticated API requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Get the current session
  const session = await getSession()

  if (!session) {
    throw new Error("No active session")
  }

  // Prepare headers with the token
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
    ...options.headers,
  }

  // Make the request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // If we get a 401 Unauthorized, try to refresh the token and retry
  if (response.status === 401) {
    // Supabase will handle token refresh automatically on the next request
    // We just need to get a fresh session
    const newSession = await getSession()

    if (!newSession) {
      throw new Error("Session expired and could not be refreshed")
    }

    // Retry the request with the new token
    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newSession.access_token}`,
        ...options.headers,
      },
    })

    return handleResponse(retryResponse)
  }

  return handleResponse(response)
}

// Helper function to handle API responses
async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type")

  if (contentType && contentType.includes("application/json")) {
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || data.error || "An error occurred")
    }

    return data
  }

  if (!response.ok) {
    throw new Error("An error occurred")
  }

  return response
}

// Helper functions for common HTTP methods
export const apiGet = async (endpoint: string, options: RequestInit = {}) => {
  return apiRequest(endpoint, { ...options, method: "GET" })
}

export const apiPost = async (endpoint: string, data: any, options: RequestInit = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const apiPut = async (endpoint: string, data: any, options: RequestInit = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const apiDelete = async (endpoint: string, options: RequestInit = {}) => {
  return apiRequest(endpoint, { ...options, method: "DELETE" })
}

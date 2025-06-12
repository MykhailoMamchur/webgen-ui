import { getAuthToken } from "./auth"

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false
// Queue of callbacks to execute after token refresh
let refreshQueue: Array<(token: string | null) => void> = []

// Function to refresh the token
async function refreshAuthToken(): Promise<string | null> {
  if (isRefreshing) {
    // If already refreshing, return a promise that resolves when refresh is complete
    return new Promise((resolve) => {
      refreshQueue.push((token) => {
        resolve(token)
      })
    })
  }

  isRefreshing = true

  try {
    console.log("API Client: Attempting to refresh token...")
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Include cookies in the request
    })

    console.log(`API Client: Refresh response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("API Client: Token refresh failed:", errorData)

      // Process the queue with null to indicate failure
      refreshQueue.forEach((callback) => callback(null))
      refreshQueue = []

      // If refresh fails, redirect to login
      console.log("API Client: Redirecting to login due to refresh failure")
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      return null
    }

    const data = await response.json()
    const newToken = data.access_token

    console.log("API Client: Token refreshed successfully")

    // Process the queue with the new token
    refreshQueue.forEach((callback) => callback(newToken))
    refreshQueue = []

    return newToken
  } catch (error) {
    console.error("API Client: Token refresh error:", error)

    // Process the queue with null to indicate failure
    refreshQueue.forEach((callback) => callback(null))
    refreshQueue = []

    // If refresh fails, redirect to login
    console.log("API Client: Redirecting to login due to refresh error")
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }

    return null
  } finally {
    isRefreshing = false
  }
}

// Time threshold in seconds before expiration to trigger a refresh
const REFRESH_THRESHOLD = 5 * 60 // 5 minutes

// Enhanced fetch function with token refresh
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  console.log(`API Client: Making request to ${url}`)

  // Get the current token
  let token = getAuthToken()
  console.log(`API Client: Current token exists: ${!!token}`)

  // Check if token exists and is about to expire
  if (token) {
    try {
      // Parse the token to get the expiration time
      const base64Url = token.split(".")[1]
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        )
        const { exp } = JSON.parse(jsonPayload)

        if (exp) {
          const currentTime = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = exp - currentTime

          console.log(`API Client: Token expires in ${timeUntilExpiry} seconds`)

          // If token is expired or will expire soon, refresh it
          if (timeUntilExpiry <= 0) {
            console.log("API Client: Token is expired, refreshing...")
            const newToken = await refreshAuthToken()
            if (newToken) {
              token = newToken
            } else {
              console.log("API Client: Token refresh failed, request will likely fail")
            }
          } else if (timeUntilExpiry < REFRESH_THRESHOLD) {
            console.log(`API Client: Token will expire in ${timeUntilExpiry} seconds, refreshing proactively...`)
            const newToken = await refreshAuthToken()
            if (newToken) {
              token = newToken
            }
          }
        }
      }
    } catch (error) {
      console.error("API Client: Error checking token expiration:", error)
      // If we can't parse the token, try to refresh it
      console.log("API Client: Cannot parse token, attempting refresh...")
      const newToken = await refreshAuthToken()
      if (newToken) {
        token = newToken
      }
    }
  } else {
    console.log("API Client: No token found, request will likely fail")
  }

  // Prepare headers with the token
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  console.log(`API Client: Making request with token: ${!!token}`)

  // Make the request with the token
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    })

    console.log(`API Client: Response status: ${response.status}`)

    // If we get a 401 or 403 Unauthorized, try to refresh the token and retry the request
    if (response.status === 401 || response.status === 403) {
      console.log(`API Client: Received ${response.status}, attempting token refresh...`)

      // Try to refresh the token
      const newToken = await refreshAuthToken()

      if (newToken) {
        console.log("API Client: Retrying request with new token...")
        // Retry the request with the new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
          credentials: "include",
        })
      } else {
        console.log("API Client: Token refresh failed, returning original response")
        return response
      }
    }

    return response
  } catch (error) {
    console.error("API Client: API request failed:", error)
    throw error
  }
}

// Helper function to handle JSON responses
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(url, options)

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`

    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage
    } catch (e) {
      // If parsing JSON fails, use the default error message
    }

    throw new Error(errorMessage)
  }

  return (await response.json()) as T
}

// POST request helper
export async function apiPost<T, D = any>(url: string, data: D, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  })
}

// GET request helper
export async function apiGet<T>(url: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    method: "GET",
    ...options,
  })
}

// PUT request helper
export async function apiPut<T, D = any>(url: string, data: D, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  })
}

// DELETE request helper
export async function apiDelete<T>(url: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    method: "DELETE",
    ...options,
  })
}
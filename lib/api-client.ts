import { getApiUrl } from "@/lib/config"

/**
 * API client for making authenticated requests
 */
export const apiClient = {
  /**
   * Make a GET request to the API
   * @param path The API path (with or without /api/ prefix)
   * @param options Additional fetch options
   * @returns The response data
   */
  async get<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(getApiUrl(path), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Make a POST request to the API
   * @param path The API path (with or without /api/ prefix)
   * @param data The data to send
   * @param options Additional fetch options
   * @returns The response data
   */
  async post<T>(path: string, data: any, options: RequestInit = {}): Promise<T> {
    const response = await fetch(getApiUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Make a PUT request to the API
   * @param path The API path (with or without /api/ prefix)
   * @param data The data to send
   * @param options Additional fetch options
   * @returns The response data
   */
  async put<T>(path: string, data: any, options: RequestInit = {}): Promise<T> {
    const response = await fetch(getApiUrl(path), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Make a DELETE request to the API
   * @param path The API path (with or without /api/ prefix)
   * @param options Additional fetch options
   * @returns The response data
   */
  async delete<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(getApiUrl(path), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },
}

export const apiPost = apiClient.post
export const apiGet = apiClient.get

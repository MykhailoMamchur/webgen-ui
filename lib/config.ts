/**
 * Configuration file for the application
 * This file contains environment-specific configuration settings
 */

// Determine if we're in production or development
const isProduction = process.env.NODE_ENV === "production"

// Set the API base URL based on the environment
// Note: We're removing the "/api" suffix from the base URL to avoid duplication
export const API_BASE_URL = isProduction ? "https://wegenweb.com" : "http://0.0.0.0:8000"

// Cookie settings based on environment
export const COOKIE_DOMAIN = isProduction ? ".wegenweb.com" : undefined
export const useSecureCookies = isProduction

// Log the environment and API base URL during startup
console.log(`Environment: ${isProduction ? "Production" : "Development"}`)
console.log(`API Base URL: ${API_BASE_URL}`)

/**
 * Helper function to build API URLs correctly
 * @param path The API path (should start with "/api/")
 * @returns The full API URL
 */
export function getApiUrl(path: string): string {
  // Ensure path starts with "/api/"
  if (!path.startsWith("/api/")) {
    path = `/api/${path.startsWith("/") ? path.substring(1) : path}`
  }

  // Remove any duplicate slashes
  const cleanPath = path.replace(/\/+/g, "/")

  // Join the base URL and path, ensuring no double slashes
  return `${API_BASE_URL}${cleanPath}`
}

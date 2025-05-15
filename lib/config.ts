/**
 * Configuration file for the application
 * This file contains environment-specific configuration settings
 */

// Determine if we're in production or development
const isProduction = process.env.NODE_ENV === "production"

// Set the API base URL based on the environment
export const API_BASE_URL = isProduction ? "https://wegenweb.com/api" : "http://0.0.0.0:8000/api"

// Cookie settings based on environment
export const COOKIE_DOMAIN = isProduction ? ".wegenweb.com" : undefined
export const useSecureCookies = isProduction

// Log the environment and API base URL during startup
console.log(`Environment: ${isProduction ? "Production" : "Development"}`)
console.log(`API Base URL: ${API_BASE_URL}`)

export const getApiBaseUrl = () => API_BASE_URL

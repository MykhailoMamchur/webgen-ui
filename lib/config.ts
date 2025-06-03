/**
 * Configuration file for the application
 * This file contains environment-specific configuration settings
 */

// Determine if we're in production or development
const isProduction = process.env.NODE_ENV === "production"

// Set the API base URL based on the environment
export const API_BASE_URL = isProduction ? "https://usemanufactura.com/api" : "http://0.0.0.0:8000/api"

// Cookie settings based on environment
export const COOKIE_DOMAIN = isProduction ? ".usemanufactura.com" : undefined
export const useSecureCookies = isProduction

// Log the environment and API base URL during startup
console.log(`Environment: ${isProduction ? "Production" : "Development"}`)
console.log(`API Base URL: ${API_BASE_URL}`)

export const getApiBaseUrl = () => API_BASE_URL

// Paddle payment configuration
export const PADDLE_ENVIRONMENT = "sandbox"
export const PADDLE_CLIENT_TOKEN = "test_3c827e906e240be60606966e954"
export const PADDLE_SUBSCRIPTION_PRICE_ID = "pri_01jwr8we80tpewr9exarwp6694"
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { parseHashParams } from "@/lib/utils"
import { COOKIE_DOMAIN, useSecureCookies } from "@/lib/config"

export default function AuthRedirectPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"processing" | "error" | "success">("processing")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        console.log("Auth redirect: Processing authentication redirect")

        // Parse hash parameters from URL
        const hashParams = parseHashParams(window.location.hash)
        console.log("Auth redirect: Hash params found:", Object.keys(hashParams).join(", "))

        // Check if we have the necessary tokens
        if (!hashParams.access_token || !hashParams.refresh_token) {
          console.error("Auth redirect: Missing required tokens")
          setStatus("error")
          setErrorMessage("Missing authentication tokens. Please try again or request a new link.")
          return
        }

        // Extract token information
        const { access_token, refresh_token, expires_in, type } = hashParams

        console.log(`Auth redirect: Token type: ${type}, expires in: ${expires_in}`)

        // Set cookies with the tokens
        const accessTokenMaxAge = Number.parseInt(expires_in) || 3600 // Default to 1 hour
        const refreshTokenMaxAge = 60 * 60 * 24 * 7 // 7 days

        // Set access token cookie
        document.cookie = `access_token=${access_token}; max-age=${accessTokenMaxAge}; path=/; domain=${COOKIE_DOMAIN}; ${useSecureCookies ? "secure;" : ""} samesite=lax;`

        // Set refresh token cookie
        document.cookie = `refresh_token=${refresh_token}; max-age=${refreshTokenMaxAge}; path=/; domain=${COOKIE_DOMAIN}; ${useSecureCookies ? "secure;" : ""} samesite=lax;`

        console.log("Auth redirect: Cookies set successfully")

        // Clear the hash from the URL for security
        window.history.replaceState({}, document.title, window.location.pathname)

        // Determine where to redirect based on token type
        if (type === "recovery") {
          console.log("Auth redirect: Redirecting to password reset page")
          setStatus("success")
          router.push("/new-password")
        } else if (type === "signup" || type === "magiclink") {
          console.log("Auth redirect: Redirecting to main app after signup/magic link")
          setStatus("success")
          router.push("/")
        } else {
          // Default redirect to main app
          console.log("Auth redirect: Redirecting to main app (default)")
          setStatus("success")
          router.push("/")
        }
      } catch (error) {
        console.error("Auth redirect: Error processing redirect:", error)
        setStatus("error")
        setErrorMessage("An error occurred while processing your authentication. Please try again.")
      }
    }

    handleAuthRedirect()
  }, [router])

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
        <div className="w-full max-w-md rounded-xl border border-red-900/20 bg-[#13111C] p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-white">Authentication Error</h1>
          <p className="mb-6 text-red-400">{errorMessage}</p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => router.push("/login")}
              className="w-full rounded-md bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-500"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push("/reset-password")}
              className="w-full rounded-md border border-purple-600/30 bg-transparent px-4 py-2 font-medium text-purple-400 hover:bg-purple-600/10"
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"></div>
        <h1 className="text-xl font-medium text-white">Processing your authentication...</h1>
        <p className="text-gray-400">You will be redirected shortly.</p>
      </div>
    </div>
  )
}

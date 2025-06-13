"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import NewPasswordForm from "@/components/auth/new-password-form"

export default function NewPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for access token in cookies
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null
      return null
    }

    const token = getCookie("access_token")

    if (token) {
      setAccessToken(token)
      setIsLoading(false)
    } else {
      setError("No authentication token found. Please request a new password reset link.")
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" />
          <h1 className="text-2xl font-semibold tracking-tight text-white">manufactura</h1>
        </div>

        {/* New Password Form */}
        <div className="rounded-xl border border-purple-900/20 bg-[#13111C] p-8 shadow-lg">
          {error ? (
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Error</h1>
                <p className="text-red-400">{error}</p>
              </div>
              <button
                onClick={() => router.push("/reset-password")}
                className="w-full rounded-md bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-500"
              >
                Request New Reset Link
              </button>
            </div>
          ) : (
            <NewPasswordForm accessToken={accessToken!} />
          )}
        </div>
      </div>
    </div>
  )
}

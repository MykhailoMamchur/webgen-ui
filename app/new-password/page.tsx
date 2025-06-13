"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { NewPasswordForm } from "@/components/auth/new-password-form"
import { parseHashParams } from "@/lib/utils"

export default function NewPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Parse the URL hash fragment to extract tokens
    if (typeof window !== "undefined") {
      const hashParams = parseHashParams(window.location.hash)

      if (hashParams.access_token && hashParams.type === "recovery") {
        setRecoveryToken(hashParams.access_token)
        // Clear the hash from the URL for security
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        setError("Invalid or missing recovery token. Please request a new password reset link.")
      }

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
            <NewPasswordForm recoveryToken={recoveryToken!} />
          )}
        </div>
      </div>
    </div>
  )
}

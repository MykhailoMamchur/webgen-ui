"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { openPaddleCheckout } from "@/lib/paddle"
import { Loader2 } from "lucide-react"

export default function SubscribePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndOpenCheckout = async () => {
      try {
        setIsLoading(true)

        // Fetch user data
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user data. Please try again.")
        }

        const userData = await response.json()

        if (!userData.email || !userData.id) {
          throw new Error("User information is incomplete. Please log in again.")
        }

        // Get return URL from query params or default to home
        const returnUrl = searchParams.get("returnUrl") || "/"

        // Initialize Paddle and open checkout
        await openPaddleCheckout({
          email: userData.email,
          userId: userData.id,
        })

        // Set a small timeout to ensure the Paddle modal has time to open
        setTimeout(() => {
          // If the user closes the Paddle modal without completing payment,
          // they'll be redirected back to where they came from
          router.push(returnUrl)
        }, 500)
      } catch (error) {
        console.error("Error in subscribe page:", error)
        setError((error as Error).message || "Failed to open checkout. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndOpenCheckout()
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A090F] text-white p-4">
      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
          <p className="text-lg">Opening payment portal...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center space-y-6 max-w-md text-center">
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-gray-300">{error}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6 max-w-md text-center">
          <p className="text-lg">If the payment window doesn't open automatically, please click the button below.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
          >
            Return to App
          </button>
        </div>
      )}
    </div>
  )
}

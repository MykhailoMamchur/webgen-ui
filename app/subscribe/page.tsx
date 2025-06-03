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
    const openCheckoutWithParams = async () => {
      try {
        setIsLoading(true)

        // Get user data from URL parameters
        const email = searchParams.get("email")
        const userId = searchParams.get("userId")
        const returnUrl = searchParams.get("returnUrl") || "/"

        if (!email || !userId) {
          throw new Error("Missing user information. Please try again from the app.")
        }

        // Initialize Paddle and open checkout
        await openPaddleCheckout({
          email: email,
          userId: userId,
        })
      } catch (error) {
        console.error("Error in subscribe page:", error)
        setError((error as Error).message || "Failed to open checkout. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    openCheckoutWithParams()
  }, [searchParams])

  const handleGoBack = () => {
    const returnUrl = searchParams.get("returnUrl")
    if (returnUrl) {
      window.location.href = returnUrl
    } else {
      // Fallback to app domain
      window.location.href = "https://app.usemanufactura.com"
    }
  }

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
            onClick={handleGoBack}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6 max-w-md text-center">
          <p className="text-lg">If the payment window doesn't open automatically, please click the button below.</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
          >
            Return to App
          </button>
        </div>
      )}
    </div>
  )
}

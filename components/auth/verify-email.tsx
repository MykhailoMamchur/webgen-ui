"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { verifyEmail } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, ArrowLeft, Mail } from "lucide-react"

// Create a separate component that uses useSearchParams
function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        return
      }

      try {
        setIsLoading(true)
        await verifyEmail(token)
        setIsVerified(true)
      } catch (error: any) {
        console.error("Email verification error:", error)
        setError(error.message || "Failed to verify email")
      } finally {
        setIsLoading(false)
      }
    }

    verify()
  }, [token])

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-500/10 p-3">
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="text-gray-400">
            We've sent a verification link to your email address. Click the link to verify your account.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            asChild
            variant="outline"
            className="w-full border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Didn't receive the email?{" "}
            <Link href="/resend-verification" className="text-purple-400 hover:text-purple-300">
              Resend verification email
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-500/10 p-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Verifying your email</h1>
          <p className="text-gray-400">Please wait while we verify your email address...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-500/10 p-3">
              <XCircle className="h-12 w-12 text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Verification failed</h1>
          <p className="text-gray-400">{error}</p>
        </div>

        <div className="space-y-4">
          <Button
            asChild
            variant="outline"
            className="w-full border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Email verified successfully!</h1>
          <p className="text-gray-400">Your email has been verified. You can now log in to your account.</p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-500 text-white">
            <Link href="/login">Continue to login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return null
}

// Main component with Suspense boundary
export function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-purple-500/10 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold">Loading...</h1>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { verifyEmail } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

export function VerifyEmail() {
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
          <h1 className="text-3xl font-bold">Verify your email</h1>
          <p className="text-gray-400">
            Please check your email for a verification link. Click the link to verify your email address.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Verifying your email</h1>
          <div className="flex justify-center mt-6">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
          <p className="text-gray-400 mt-4">Please wait while we verify your email address...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold">Verification failed</h1>
          <p className="text-gray-400">{error}</p>
        </div>

        <div className="space-y-4">
          <Button asChild variant="outline" className="w-full">
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
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold">Email verified</h1>
          <p className="text-gray-400">
            Your email has been successfully verified. You can now log in to your account.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-500">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return null
}

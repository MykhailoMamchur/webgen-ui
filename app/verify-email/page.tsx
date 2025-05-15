import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            We've sent you a verification link to confirm your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 space-y-4">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    Please check your email inbox and click on the verification link to complete your registration.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              <p>
                Didn't receive an email?{" "}
                <Link href="/resend-verification" className="font-medium text-blue-600 hover:text-blue-500">
                  Resend verification email
                </Link>
              </p>
            </div>
            <div className="text-center text-sm text-gray-600">
              <p>
                Already verified?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { Suspense } from "react"
import { Sparkles } from "lucide-react"
import { VerifyEmail } from "@/components/auth/verify-email"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" />
          <h1 className="text-2xl font-semibold tracking-tight text-white">manufactura</h1>
        </div>

        {/* Verify Email Content */}
        <div className="rounded-xl border border-purple-900/20 bg-[#13111C] p-8 shadow-lg">
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"></div>
              </div>
            }
          >
            <VerifyEmail />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

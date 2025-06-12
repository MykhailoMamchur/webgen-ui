import { Suspense } from "react"
import { VerifyEmail } from "@/components/auth/verify-email"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
      <div className="w-full max-w-md rounded-xl border border-purple-900/20 bg-[#13111C] p-8 shadow-lg">
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
  )
}

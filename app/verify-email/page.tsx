import { VerifyEmail } from "@/components/auth/verify-email"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
      <div className="w-full max-w-md rounded-xl border border-purple-900/20 bg-[#13111C] p-8 shadow-lg">
        <VerifyEmail />
      </div>
    </div>
  )
}

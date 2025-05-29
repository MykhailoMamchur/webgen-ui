import { Sparkles } from "lucide-react"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" />
          <h1 className="text-2xl font-semibold tracking-tight text-white">manufactura</h1>
        </div>

        {/* Signup Form */}
        <div className="rounded-xl border border-purple-900/20 bg-[#13111C] p-8 shadow-lg">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}

import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A090F] p-4">
      <div className="w-full max-w-md rounded-xl border border-purple-900/20 bg-[#13111C] p-8 shadow-lg">
        <SignupForm />
      </div>
    </div>
  )
}

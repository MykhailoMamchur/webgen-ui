import { AccountSettings } from "@/components/auth/account-settings"
import { ProtectedRoute } from "@/components/protected-route"

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <div className="max-w-3xl mx-auto rounded-xl border border-purple-900/20 bg-[#13111C] p-8 shadow-lg">
          <AccountSettings />
        </div>
      </div>
    </ProtectedRoute>
  )
}

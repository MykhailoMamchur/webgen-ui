import { type NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    // Call the backend API to resend verification email
    const response = await fetch(`${getApiBaseUrl()}/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { message: errorData.message || "Failed to resend verification email" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error resending verification email:", error)
    return NextResponse.json({ message: "An error occurred while resending verification email" }, { status: 500 })
  }
}

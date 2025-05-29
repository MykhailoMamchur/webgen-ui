import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, domain } = body

    if (!project_id || !domain) {
      return NextResponse.json({ error: "project_id and domain are required" }, { status: 400 })
    }

    console.log(`Setting up domain ${domain} for project ${project_id}`)

    const response = await fetch(`${API_BASE_URL}/deployment/domain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        project_id,
        domain,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Domain setup failed:", errorData)
      return NextResponse.json(
        { error: errorData.error || `Domain setup failed: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Domain setup successful:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error setting up domain:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

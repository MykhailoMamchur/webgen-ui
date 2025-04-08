import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Update the API endpoint to use wegenweb.com/api
    const response = await fetch("https://wegenweb.com/api/projects", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    // Return the response directly
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in projects API route:", error)
    return NextResponse.json(
      { error: `Failed to fetch projects: ${(error as Error).message}`, projects: [] },
      { status: 500 },
    )
  }
}

"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip redirect during loading
    if (isLoading) return

    // If not authenticated and not on an auth page, redirect to login
    if (
      !isAuthenticated &&
      !pathname.includes("/login") &&
      !pathname.includes("/signup") &&
      !pathname.includes("/reset-password") &&
      !pathname.includes("/verify-email")
    ) {
      // Store the current path to redirect back after login
      localStorage.setItem("auth_redirect", pathname)
      router.push("/login")
    }

    // If authenticated and on an auth page, redirect to home
    // This prevents redirect loops
    if (
      isAuthenticated &&
      (pathname.includes("/login") || pathname.includes("/signup") || pathname.includes("/reset-password"))
    ) {
      // Check if there's a stored redirect path
      const redirectPath = localStorage.getItem("auth_redirect") || "/"
      localStorage.removeItem("auth_redirect") // Clear the stored path
      router.push(redirectPath)
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, render children
  return isAuthenticated ? <>{children}</> : null
}

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { loginUser, registerUser, logoutUser, resetPassword, getCurrentUser, confirmPasswordReset } from "@/lib/auth"

export interface User {
  id: string
  email: string
  created_at?: string
  name?: string
  emailVerified?: boolean
  updatedAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, passwordConfirm: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  confirmPasswordReset: (token: string, password: string) => Promise<void>
  updateUser: (user: Partial<User>) => void
  refreshUserToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()
  const isLoggingOut = useRef(false)

  // Simplified auth check - just try to get current user
  useEffect(() => {
    // Skip auth check if currently logging out
    if (isLoggingOut.current) {
      console.log("Auth check skipped - logout in progress")
      return
    }

    const checkAuth = async () => {
      try {
        console.log(`Auth check starting for pathname: ${pathname}`)
        setIsLoading(true)

        // Skip auth check for public routes
        const isPublicPath = ["/signup", "/login", "/reset-password", "/verify-email", "/subscribe"].includes(pathname)

        if (isPublicPath) {
          console.log("Public path detected, skipping auth check")
          setUser(null)
          setIsLoading(false)
          return
        }

        // Try to get current user - middleware handles token validation/refresh
        console.log("Attempting to get current user...")
        const userData = await getCurrentUser()
        console.log("User data retrieved successfully:", userData.email)
        setUser(userData)
      } catch (error) {
        console.error("Authentication error:", error)
        setUser(null)

        // Only redirect to login if not already on a public route
        if (!["/signup", "/login", "/reset-password", "/verify-email"].includes(pathname)) {
          console.log("Redirecting to login due to auth failure")
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log("Login attempt starting...")
      setIsLoading(true)
      const { user } = await loginUser(email, password)
      setUser(user)

      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "error",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (email: string, password: string, passwordConfirm: string) => {
    try {
      console.log("Signup attempt starting...")
      setIsLoading(true)
      const { user } = await registerUser(email, password, passwordConfirm)
      setUser(user)

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
        variant: "success",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "error",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log("Logout attempt starting...")
      isLoggingOut.current = true
      setIsLoading(true)

      await logoutUser()
      setUser(null)

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
        variant: "success",
      })

      console.log("Logout successful, redirecting to login...")
      router.push("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: error.message || "Could not log you out",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
      // Reset logout flag after a delay to allow navigation to complete
      setTimeout(() => {
        isLoggingOut.current = false
      }, 1000)
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      console.log("Password reset attempt starting...")
      setIsLoading(true)
      await resetPassword(email)

      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions",
        variant: "success",
      })

      router.push("/login")
    } catch (error: any) {
      console.error("Password reset error:", error)
      toast({
        title: "Password reset failed",
        description: error.message || "Could not send password reset email",
        variant: "error",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmPasswordReset = async (token: string, password: string) => {
    try {
      console.log("Password reset confirmation starting...")
      setIsLoading(true)
      await confirmPasswordReset(token, password)

      toast({
        title: "Password updated",
        description: "Your password has been reset successfully",
        variant: "success",
      })
    } catch (error: any) {
      console.error("Password reset confirmation error:", error)
      toast({
        title: "Password reset failed",
        description: error.message || "Could not reset your password",
        variant: "error",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = (updatedUserData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUserData })
    }
  }

  // No-op since middleware handles token refresh
  const refreshUserToken = async (): Promise<boolean> => true

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    confirmPasswordReset: handleConfirmPasswordReset,
    updateUser,
    refreshUserToken,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

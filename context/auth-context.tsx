"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { loginUser, registerUser, logoutUser, resetPassword, getCurrentUser } from "@/lib/auth"

export interface User {
  id: string
  email: string
  name?: string
  emailVerified?: boolean
  createdAt?: string
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
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)

        // Try to get current user with the token
        const userData = await getCurrentUser()
        setUser(userData)

        // Set up token refresh
        const refreshIntervalId = setupTokenRefresh()

        return () => {
          if (refreshIntervalId) clearInterval(refreshIntervalId)
        }
      } catch (error) {
        console.error("Authentication error:", error)
        setUser(null)
        localStorage.removeItem("auth_token")

        // Redirect to signup page if not on an auth page
        if (
          pathname !== "/signup" &&
          pathname !== "/login" &&
          pathname !== "/reset-password" &&
          pathname !== "/verify-email"
        ) {
          router.push("/signup")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  // Set up token refresh interval
  const setupTokenRefresh = () => {
    // Refresh token every 25 minutes (assuming 30 min expiry)
    const refreshInterval = setInterval(
      async () => {
        try {
          // Use our API route for token refresh
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include", // Include cookies in the request
          })

          if (!response.ok) {
            throw new Error("Token refresh failed")
          }

          const data = await response.json()

          // Update localStorage if needed
          if (data.token) {
            localStorage.setItem("auth_token", data.token)
          }
        } catch (error) {
          console.error("Token refresh failed:", error)
          // If refresh fails, log the user out
          handleLogout()
          clearInterval(refreshInterval)
        }
      },
      25 * 60 * 1000, // 25 minutes
    )

    return refreshInterval
  }

  // Login function
  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { user: userData, token } = await loginUser(email, password)

      // Save token to localStorage
      localStorage.setItem("auth_token", token)

      // Update user state
      setUser(userData)

      // Set up token refresh
      setupTokenRefresh()

      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      })

      // Redirect to home page or intended destination
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

  // Signup function - Updated to match backend expectations
  const handleSignup = async (email: string, password: string, passwordConfirm: string) => {
    try {
      setIsLoading(true)
      const { user: userData, token } = await registerUser(email, password, passwordConfirm)

      // Save token to localStorage
      localStorage.setItem("auth_token", token)

      // Update user state
      setUser(userData)

      // Set up token refresh
      setupTokenRefresh()

      // Show success toast
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
        variant: "success",
      })

      // Redirect to home page instead of verification page
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

  // Logout function
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await logoutUser()

      // Clear token from localStorage
      localStorage.removeItem("auth_token")

      // Update user state
      setUser(null)

      // Show success toast
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
        variant: "success",
      })

      // Redirect to login page
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
    }
  }

  // Reset password function
  const handleResetPassword = async (email: string) => {
    try {
      setIsLoading(true)
      await resetPassword(email)

      // Show success toast
      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions",
        variant: "success",
      })

      // Redirect to login page
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

  // Update user function
  const updateUser = (updatedUserData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUserData })
    }
  }

  // Create context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    updateUser,
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

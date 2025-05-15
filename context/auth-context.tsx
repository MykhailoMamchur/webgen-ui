"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import {
  loginUser,
  registerUser,
  logoutUser,
  resetPassword,
  refreshToken,
  isTokenExpired,
  getAuthToken,
  getCurrentUser,
} from "@/lib/auth"

// Update the User interface to match the API response
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
  updateUser: (user: Partial<User>) => void
  refreshUserToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()

  // Function to refresh the token
  const refreshUserToken = async (): Promise<boolean> => {
    try {
      await refreshToken()
      return true
    } catch (error) {
      console.error("Token refresh failed:", error)
      return false
    }
  }

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)

        // Skip authentication check for public routes
        if (
          pathname === "/signup" ||
          pathname === "/login" ||
          pathname === "/reset-password" ||
          pathname === "/verify-email"
        ) {
          setUser(null)
          setIsLoading(false)
          return
        }

        // Check if token exists and is expired
        const token = getAuthToken()
        if (token && isTokenExpired(token)) {
          // Try to refresh the token
          const refreshed = await refreshUserToken()
          if (!refreshed) {
            // If refresh fails, redirect to login
            setUser(null)
            router.push("/login")
            setIsLoading(false)
            return
          }
        }

        // Try to get current user with the token using our local API route
        try {
          const userData = await getCurrentUser()
          setUser(userData)
        } catch (error) {
          // If 401 Unauthorized, try to refresh the token
          console.error("Failed to get user data:", error)

          const refreshed = await refreshUserToken()
          if (refreshed) {
            // If refresh succeeds, try to get user data again
            try {
              const userData = await getCurrentUser()
              setUser(userData)
            } catch (retryError) {
              console.error("Failed to get user data after token refresh:", retryError)
              setUser(null)
              router.push("/login")
            }
          } else {
            // If refresh fails, redirect to login
            setUser(null)
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Authentication error:", error)
        setUser(null)

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

  // Login function
  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { user, access_token, refresh_token } = await loginUser(email, password)

      // Update user state
      setUser(user)

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
      const { user, access_token, refresh_token } = await registerUser(email, password, passwordConfirm)

      // Update user state
      setUser(user)

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

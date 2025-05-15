"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  getUser,
  getSession,
  updateProfile,
} from "@/lib/supabase"

// Update the User interface to match Supabase User
export interface User extends SupabaseUser {
  name?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, passwordConfirm: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUser: (user: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true)

        // Skip authentication check for public routes
        if (
          pathname === "/signup" ||
          pathname === "/login" ||
          pathname === "/reset-password" ||
          pathname === "/verify-email" ||
          pathname === "/auth/callback" ||
          pathname === "/resend-verification"
        ) {
          setUser(null)
          setSession(null)
          setIsLoading(false)
          return
        }

        // Get the current session
        const currentSession = await getSession()
        console.log("Current session:", currentSession ? "exists" : "null")

        setSession(currentSession)

        if (currentSession) {
          // Get the current user
          const currentUser = await getUser()
          console.log("Current user:", currentUser ? "exists" : "null")

          setUser(currentUser as User)
        } else {
          // Check for traditional cookies as fallback
          const hasAccessToken = document.cookie.includes("access_token=") || document.cookie.includes("session_token=")

          console.log("Has access token cookie:", hasAccessToken)

          if (hasAccessToken) {
            // Try to get user data with the token
            try {
              const response = await fetch("/api/auth/me", {
                method: "GET",
                credentials: "include",
              })

              if (response.ok) {
                const userData = await response.json()
                console.log("User data from API:", userData)
                setUser(userData as User)
                // Don't redirect in this case
                setIsLoading(false)
                return
              }
            } catch (error) {
              console.error("Error fetching user data with token:", error)
            }
          }

          // If no session or token, redirect to login
          setUser(null)

          // Redirect to login page if not on an auth page
          console.log("No session, redirecting to login")
          router.push("/login")
        }
      } catch (error) {
        console.error("Authentication error:", error)
        setUser(null)
        setSession(null)

        // Redirect to login page if not on an auth page
        if (
          pathname !== "/signup" &&
          pathname !== "/login" &&
          pathname !== "/reset-password" &&
          pathname !== "/verify-email" &&
          pathname !== "/auth/callback" &&
          pathname !== "/resend-verification"
        ) {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`Auth state changed: ${event}`)
      setSession(newSession)

      if (newSession) {
        const newUser = await getUser()
        setUser(newUser as User)
      } else {
        setUser(null)
      }
    })

    // Clean up the subscription
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [pathname, router])

  // Login function
  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { session, user } = await signInWithEmail(email, password)

      setSession(session)
      setUser(user as User)

      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      })

      // Redirect to home page or intended destination
      setTimeout(() => {
        router.push("/")
      }, 500) // Short delay to ensure cookies are set
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

  // Signup function
  const handleSignup = async (email: string, password: string, passwordConfirm: string) => {
    try {
      setIsLoading(true)

      // Validate password confirmation
      if (password !== passwordConfirm) {
        throw new Error("Passwords do not match")
      }

      const { user, session } = await signUpWithEmail(email, password)

      // Show success toast and redirect to verification page
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
        variant: "success",
      })

      // Redirect to a verification page
      router.push("/verify-email")
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
      await signOut()

      // Update state
      setUser(null)
      setSession(null)

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
  const handleUpdateUser = async (updatedUserData: Partial<User>) => {
    try {
      setIsLoading(true)

      // Extract email and other data
      const { email, ...userData } = updatedUserData

      // Prepare update object
      const updates: { email?: string; data?: any } = {}
      if (email) updates.email = email
      if (Object.keys(userData).length > 0) updates.data = userData

      // Update the user profile
      const { user: updatedUser } = await updateProfile(updates)

      // Update local state
      setUser(updatedUser as User)

      // Show success toast
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
        variant: "success",
      })
    } catch (error: any) {
      console.error("Update user error:", error)
      toast({
        title: "Update failed",
        description: error.message || "Could not update your profile",
        variant: "error",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Create context value
  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user || !!session, // Consider authenticated if either user or session exists
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    updateUser: handleUpdateUser,
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

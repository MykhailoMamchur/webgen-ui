"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Eye, EyeOff, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

// Password validation schema
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof passwordSchema>

interface NewPasswordFormProps {
  accessToken: string
}

export default function NewPasswordForm({ accessToken }: NewPasswordFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Check password requirements as user types
  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    })
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_password: data.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reset password")
      }

      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
        variant: "default",
      })

      // Redirect to login page after successful password reset
      router.push("/login")
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-sm text-gray-400">Please create a new password for your account</p>
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    className="pr-10 bg-[#1A1825] border-purple-900/30 text-white"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      checkPasswordRequirements(e.target.value)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password requirements */}
        <div className="space-y-2 rounded-md bg-[#1A1825]/50 p-3 text-sm">
          <p className="font-medium text-gray-300">Password requirements:</p>
          <ul className="space-y-1 text-xs">
            <li className="flex items-center gap-2">
              {passwordRequirements.minLength ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <X size={14} className="text-gray-500" />
              )}
              <span className={passwordRequirements.minLength ? "text-green-500" : "text-gray-400"}>
                At least 8 characters
              </span>
            </li>
            <li className="flex items-center gap-2">
              {passwordRequirements.hasUppercase ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <X size={14} className="text-gray-500" />
              )}
              <span className={passwordRequirements.hasUppercase ? "text-green-500" : "text-gray-400"}>
                At least one uppercase letter
              </span>
            </li>
            <li className="flex items-center gap-2">
              {passwordRequirements.hasLowercase ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <X size={14} className="text-gray-500" />
              )}
              <span className={passwordRequirements.hasLowercase ? "text-green-500" : "text-gray-400"}>
                At least one lowercase letter
              </span>
            </li>
            <li className="flex items-center gap-2">
              {passwordRequirements.hasNumber ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <X size={14} className="text-gray-500" />
              )}
              <span className={passwordRequirements.hasNumber ? "text-green-500" : "text-gray-400"}>
                At least one number
              </span>
            </li>
          </ul>
        </div>

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pr-10 bg-[#1A1825] border-purple-900/30 text-white"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500" disabled={isLoading}>
          {isLoading ? "Updating Password..." : "Update Password"}
        </Button>
      </form>
    </Form>
  )
}

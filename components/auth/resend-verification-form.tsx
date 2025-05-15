"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// Form validation schema
const resendSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ResendFormValues = z.infer<typeof resendSchema>

export function ResendVerificationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  // Initialize form
  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: "",
    },
  })

  // Form submission handler
  const onSubmit = async (values: ResendFormValues) => {
    try {
      setIsLoading(true)

      // Call the API to resend verification email
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: values.email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to resend verification email")
      }

      setUserEmail(values.email)
      setIsSuccess(true)
    } catch (error: any) {
      console.error("Resend verification error:", error)
      toast({
        title: "Failed to resend verification email",
        description: error.message || "Please try again later",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card className="border-green-100 bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-700">Verification Email Sent</h2>
            <p className="mb-6 text-green-600">
              We've sent a new verification email to <strong>{userEmail}</strong>
            </p>
            <div className="mb-6 rounded-lg bg-white p-4 text-left text-sm text-gray-600">
              <div className="mb-2 flex items-center">
                <Mail className="mr-2 h-5 w-5 text-purple-500" />
                <span className="font-medium">Next steps:</span>
              </div>
              <ol className="ml-7 list-decimal space-y-1">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Once verified, you can log in to your account</li>
              </ol>
            </div>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Resend Verification Email</h1>
        <p className="text-gray-400">Enter your email to receive a new verification link</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your.email@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-gray-400">
          Remember your password?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

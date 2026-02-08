"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth"
import { forgotPasswordApi } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [isShaking, setIsShaking] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordApi(data.email)
      // Always show success to prevent email enumeration
      setIsSuccess(true)
      setSubmittedEmail(data.email)
    } catch (_error) {
      toast.error("An unexpected error occurred. Please try again.")
      // Trigger shake animation
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 300)
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="size-12 text-primary" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold">Check your email!</h1>
          <p className="text-muted-foreground text-sm">
            We sent a reset link to {submittedEmail}
          </p>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors justify-center"
        >
          <ArrowLeft className="size-4" />
          Back to Sign In
        </Link>
      </div>
    )
  }

  // Form state
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className={isShaking ? "animate-shake" : ""}>
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
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Send Reset Link
            </Button>
          </form>
        </Form>
      </div>

      <Link
        href="/login"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors justify-center"
      >
        <ArrowLeft className="size-4" />
        Back to Sign In
      </Link>
    </div>
  )
}

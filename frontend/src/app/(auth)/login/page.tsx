"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { loginSchema, type LoginFormData } from "@/shared/lib/validations/auth"
import { useAuthStore } from "@/features/auth/stores"
import { ApiError } from "@/shared/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons"
import { useShakeAnimation } from "@/shared/hooks/use-shake-animation"

export default function LoginPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const { isShaking, triggerShake } = useShakeAnimation({ duration: 300 })

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: LoginFormData) => {
    try {
      await useAuthStore.getState().login(data.email, data.password)
      toast.success("Вы вошли в систему!")
      const returnUrl = searchParams.get("returnUrl") || "/dashboard"
      router.push(returnUrl)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Произошла ошибка. Попробуйте ещё раз."
      toast.error(message)
      triggerShake()
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-bold">{t("login_title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {t("login_subtitle")}
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
                  <FormLabel>{t("email")}</FormLabel>
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Введите пароль"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showPassword ? "Скрыть пароль" : "Показать пароль"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t("forgot_password")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {t("login_btn")}
            </Button>
          </form>
        </Form>
      </div>

      <SocialLoginButtons />

      <p className="text-sm text-center text-muted-foreground">
        {t("no_account")}{" "}
        <Link href="/register" className="text-primary hover:underline">
          {t("sign_up")} →
        </Link>
      </p>
    </div>
  )
}

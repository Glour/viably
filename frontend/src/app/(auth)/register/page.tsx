"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { trackSignup } from "@/shared/config/analytics-helpers"
import { registerSchema, type RegisterFormData } from "@/shared/lib/validations/auth"
import { useAuthStore } from "@/features/auth/stores"
import { ApiError } from "@/shared/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { PasswordStrength } from "@/features/auth/components/password-strength"
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons"
import { useShakeAnimation } from "@/shared/hooks/use-shake-animation"

export default function RegisterPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { isShaking, triggerShake } = useShakeAnimation({ duration: 300 })

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false as never,
    },
  })

  const { isSubmitting } = form.formState

  // Watch password field for real-time strength indicator
  const passwordValue = useWatch({
    control: form.control,
    name: "password",
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await useAuthStore.getState().register({
        email: data.email,
        password: data.password,
        fullName: data.name,
      })
      trackSignup("email")
      toast.success("Аккаунт создан!")
      router.push("/dashboard")
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Произошла ошибка. Попробуйте ещё раз."
      toast.error(message)
      triggerShake()
    }
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-bold">{t("register_title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {t("register_subtitle")}
        </p>
      </div>

      <div className={isShaking ? "animate-shake" : ""}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Иванов" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
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

            {/* Password Field with Strength Indicator */}
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
                  <PasswordStrength password={passwordValue || ""} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подтвердите пароль</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Подтвердите пароль"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showConfirmPassword
                            ? "Скрыть пароль"
                            : "Показать пароль"
                        }
                      >
                        {showConfirmPassword ? (
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

            {/* Terms and Conditions Checkbox */}
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="grid gap-1 leading-snug">
                    <FormLabel className="text-xs sm:text-sm font-normal leading-snug">
                      Я принимаю{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        Условия использования
                      </Link>{" "}
                      и{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Политику конфиденциальности
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {t("register_btn")}
            </Button>
          </form>
        </Form>
      </div>

      <SocialLoginButtons />

      {/* Sign In Link */}
      <p className="text-sm text-center text-muted-foreground">
        {t("has_account")}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t("sign_in")} →
        </Link>
      </p>
    </div>
  )
}

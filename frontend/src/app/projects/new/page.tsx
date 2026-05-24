"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles, ArrowLeft, Loader2, Lightbulb } from "lucide-react"
import { toast } from "sonner"

import { createProjectSchema, type CreateProjectFormData } from "@/shared/lib/validations/project"
import { useCreateProject } from "@/shared/hooks/use-projects"
import { useTemplates } from "@/shared/hooks/use-templates"
import { MainLayout } from "@/widgets/layout"
import { FadeInUp } from "@/shared/components/motion/fade-in-up"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/shared/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { ApiError } from "@/shared/types"

function detectCategory(text: string): "telegram_bot" | "website" | "webapp" {
  const lower = text.toLowerCase()
  const telegramKeywords = ["бот", "bot", "telegram", "телеграм", "tg", "aiogram", "pyrogram"]
  if (telegramKeywords.some((kw) => lower.includes(kw))) return "telegram_bot"

  const webappKeywords = ["dashboard", "дашборд", "admin", "panel", "панель", "analytics", "crm", "erp", "app", "application", "приложение", "кабинет", "portal"]
  if (webappKeywords.some((kw) => lower.includes(kw))) return "webapp"

  const websiteKeywords = ["landing", "landing page", "лендинг", "website", "site", "сайт", "portfolio", "портфолио", "store", "shop", "магазин", "ecommerce", "promo", "промо"]
  if (websiteKeywords.some((kw) => lower.includes(kw))) return "website"

  return "webapp"
}

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useCreateProject()
  const { data: templates, isLoading: templatesLoading } = useTemplates()
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      templateId: undefined,
    },
  })

  const onSubmit = async (data: CreateProjectFormData) => {
    setIsCreating(true)
    try {
      // For projects without template, set allowEmpty: true
      const isEmptyProject = !data.templateId || data.templateId === "empty"
      const promptText = [data.name, data.description].filter(Boolean).join("\n\n")
      const payload = {
        name: data.name,
        description: data.description || "",
        templateId: isEmptyProject ? null : (data.templateId ?? null),
        config: isEmptyProject
          ? {
              initialPrompt: promptText,
              category: detectCategory([data.name, data.description].filter(Boolean).join(" ")),
            }
          : {},
        allowEmpty: isEmptyProject,
      }

      const newProject = await createProject.mutateAsync(payload)

      toast.success("Проект создан!", {
        description: "Сейчас перенаправим на страницу генерации",
      })

      // Redirect to generation page
      router.push(`/projects/${newProject.id}/ai`)
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : "Не удалось создать проект. Попробуйте снова."
      toast.error(message)
      setIsCreating(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <FadeInUp delay={0}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-card/60"
            >
              <Link href="/projects">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
                Создать проект
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Заполни информацию о новом проекте
              </p>
            </div>
          </div>
        </FadeInUp>

        {/* Form Card */}
        <FadeInUp delay={0.1}>
          <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden bg-gradient-to-br from-primary/5 via-primary-subtle to-transparent border border-border/50 backdrop-blur-xl">
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-glow)] blur-[80px] opacity-20 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 blur-[60px] opacity-20 rounded-full pointer-events-none" />

            {/* Form */}
            <div className="relative z-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Project Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Название проекта
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Мой телеграм-бот"
                            className="h-12 text-base bg-card/40 border-border/60 backdrop-blur-sm focus:border-primary/50"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Короткое и понятное название вашего бота
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Описание (необязательно)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Опиши что будет делать твой бот..."
                            className="min-h-[120px] text-base bg-card/40 border-border/60 backdrop-blur-sm focus:border-primary/50 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Расскажи о функциях и возможностях твоего бота
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Template Selection */}
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Шаблон (необязательно)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={templatesLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 text-base bg-card/40 border-border/60 backdrop-blur-sm">
                              <SelectValue placeholder="Без шаблона (создать с нуля)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="empty">
                              Без шаблона (создать с нуля)
                            </SelectItem>
                            {templates?.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} ({template.creditCost} кредитов)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Выбери готовый шаблон или создай бота с нуля
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isCreating}
                      className="flex-1 h-12 text-base font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_20px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_32px_var(--primary-glow)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="size-5 mr-2 animate-spin" />
                          Создаём...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-5 mr-2" />
                          Создать проект
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      asChild
                      disabled={isCreating}
                      className="h-12 px-6 text-base border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-primary/50"
                    >
                      <Link href="/projects">Отмена</Link>
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </FadeInUp>

        {/* Help Card */}
        <FadeInUp delay={0.2}>
          <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-blue-500" />Подсказка</h3>
            <p className="text-sm text-muted-foreground">
              Если выберешь шаблон, мы подставим готовую структуру кода.
              Если создашь с нуля, сможешь описать функциональность на следующем шаге.
            </p>
          </div>
        </FadeInUp>
      </div>
    </MainLayout>
  )
}

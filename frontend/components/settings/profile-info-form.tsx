"use client"

import { useCallback, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser, useUpdateProfile } from "@/lib/hooks/use-user"
import { profileSchema, type ProfileFormData } from "@/lib/validations/settings"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

export function ProfileInfoForm() {
  const { data: profile } = useCurrentUser()
  const updateProfile = useUpdateProfile()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.fullName ?? "",
    },
    values: profile ? { name: profile.fullName ?? "" } : undefined,
  })

  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Поддерживаются только изображения (JPEG, PNG, GIF, WebP)")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Максимальный размер файла — 5 МБ")
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const onSubmit = (data: ProfileFormData) => {
    // TODO: avatarFile upload not yet supported by backend
    void avatarFile
    updateProfile.mutate(
      { fullName: data.name },
      {
        onSuccess: () => {
          toast.success("Профиль обновлён")
          setAvatarFile(null)
        },
        onError: () => {
          toast.error("Не удалось обновить профиль")
        },
      }
    )
  }

  const avatarSrc = avatarPreview ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName ?? "U")}&size=120&background=random`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Информация профиля</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div
                role="button"
                tabIndex={0}
                aria-label="Загрузить аватар"
                className={`relative size-20 sm:size-[120px] rounded-full overflow-hidden cursor-pointer border-2 transition-colors ${
                  isDragging ? "border-primary border-dashed" : "border-border"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <img
                  src={avatarSrc}
                  alt="Аватар"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="size-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              <div className="text-sm text-muted-foreground">
                <p>Нажмите или перетащите изображение</p>
                <p>JPEG, PNG, GIF, WebP. Макс. 5 МБ</p>
              </div>
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Ваше имя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <Input
                value={profile?.email ?? ""}
                readOnly
                disabled
                className="opacity-60"
              />
            </div>

            <Button type="submit" loading={updateProfile.isPending} disabled={updateProfile.isPending}>
              Сохранить изменения
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

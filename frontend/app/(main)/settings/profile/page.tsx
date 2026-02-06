"use client"

import { useEffect } from "react"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { ProfileInfoForm } from "@/components/settings/profile-info-form"
import { ChangePasswordForm } from "@/components/settings/change-password-form"
import { useSettingsStore } from "@/stores/settings"

export default function ProfileSettingsPage() {
  const { loadProfile } = useSettingsStore()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return (
    <div className="space-y-6">
      <FadeInUp delay={0}>
        <ProfileInfoForm />
      </FadeInUp>
      <FadeInUp delay={0.1}>
        <ChangePasswordForm />
      </FadeInUp>
    </div>
  )
}

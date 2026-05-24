import type { Metadata } from "next"

import { FadeInUp } from "@/shared/components/motion/fade-in-up"
import { ProfileInfoForm } from "@/features/settings/components/profile-info-form"
import { ChangePasswordForm } from "@/features/settings/components/change-password-form"

export const metadata: Metadata = {
  title: "Профиль",
}

export default function ProfileSettingsPage() {
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

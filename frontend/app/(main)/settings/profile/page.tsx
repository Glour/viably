import type { Metadata } from "next"

import { FadeInUp } from "@/components/motion/fade-in-up"
import { ProfileInfoForm } from "@/components/settings/profile-info-form"
import { ChangePasswordForm } from "@/components/settings/change-password-form"

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

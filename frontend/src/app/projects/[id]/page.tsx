"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/projects/${id}/ai`)
  }, [id, router])

  return null
}

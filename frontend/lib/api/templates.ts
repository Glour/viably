import type {
  TemplatesResponse,
  CreateProjectResponse,
} from "@/types"
import { TEMPLATES } from "@/lib/data/templates"

export async function getTemplates(): Promise<TemplatesResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  return {
    success: true,
    templates: TEMPLATES,
  }
}

export async function createProjectFromTemplate(
  templateSlug: string
): Promise<CreateProjectResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const template = TEMPLATES.find((t) => t.slug === templateSlug)

  if (!template) {
    return { success: false, error: "Template not found" }
  }

  const projectId = `proj_${Date.now()}`

  return {
    success: true,
    projectId,
    redirectUrl: `/projects/${projectId}/generate`,
  }
}

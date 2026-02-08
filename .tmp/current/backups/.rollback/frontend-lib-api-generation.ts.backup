import type {
  ConfigFormValues,
  DeployConfig,
  StartGenerationResponse,
  StartDeploymentResponse,
  ProjectFile,
  TemplateResponse,
} from "@/types"
import { TEMPLATES } from "@/lib/data/templates"
import { downloadZip } from "client-zip"

/**
 * Recursively flatten the file tree into a flat array of file entries only
 */
function flattenFiles(files: ProjectFile[]): ProjectFile[] {
  const result: ProjectFile[] = []

  function traverse(items: ProjectFile[]) {
    for (const item of items) {
      if (item.type === "file") {
        result.push(item)
      }
      if (item.children) {
        traverse(item.children)
      }
    }
  }

  traverse(files)
  return result
}

/**
 * Start code generation for a project
 * Mock implementation: returns success after 300ms delay
 * Actual progress simulation happens in the generation hook
 */
export async function startGeneration(
  projectId: string,
  config: ConfigFormValues | { freeText: string },
  templateSlug: string
): Promise<StartGenerationResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  // In production, this would validate inputs and trigger backend generation
  // For mock, we just acknowledge the request
  return { success: true }
}

/**
 * Start deployment for a generated project
 * Mock implementation: validates bot token and returns success after 300ms
 */
export async function startDeployment(
  projectId: string,
  config: DeployConfig
): Promise<StartDeploymentResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Validate bot token is not empty
  if (!config.botToken || config.botToken.trim() === "") {
    return {
      success: false,
      error: "Bot token is required for deployment",
    }
  }

  // In production, this would validate the token format and start deployment
  return { success: true }
}

/**
 * Download generated code as a ZIP file
 * Uses client-zip to create a browser download of the file tree
 */
export async function downloadGeneratedCode(
  files: ProjectFile[]
): Promise<void> {
  // Flatten the recursive tree structure into a flat list of files
  const flatFiles = flattenFiles(files)

  if (flatFiles.length === 0) {
    throw new Error("No files to download")
  }

  // Create ZIP blob using client-zip
  const blob = await downloadZip(
    flatFiles.map((file) => ({
      name: file.path,
      input: file.content || "",
    }))
  ).blob()

  // Trigger browser download
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "bot-code.zip"
  link.click()

  // Clean up object URL
  URL.revokeObjectURL(link.href)
}

/**
 * Get template for a project
 * Mock implementation: returns the first template from the templates array
 */
export async function getTemplateForProject(
  projectId: string
): Promise<TemplateResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  // In production, this would look up the template used for this project
  // For mock, we return the first template
  if (TEMPLATES.length === 0) {
    return {
      success: false,
      error: "No templates available",
    }
  }

  return {
    success: true,
    template: TEMPLATES[0],
  }
}

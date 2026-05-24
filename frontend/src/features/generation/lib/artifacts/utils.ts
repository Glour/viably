/**
 * Artifact utilities for download, copy, and share functionality
 */

import { toast } from "sonner"
import type { Artifact } from "@/features/generation/types"

/**
 * Get file extension for artifact type
 */
function getFileExtension(artifact: Artifact): string {
  const extensionMap: Record<string, string> = {
    html: "html",
    react: "tsx",
    vue: "vue",
    svelte: "svelte",
    python: "py",
    javascript: "js",
    typescript: "ts",
    css: "css",
    json: "json",
    yaml: "yaml",
    markdown: "md",
    text: "txt",
  }

  return extensionMap[artifact.type] || artifact.language || "txt"
}

/**
 * Get MIME type for artifact
 */
function getMimeType(artifact: Artifact): string {
  const mimeMap: Record<string, string> = {
    html: "text/html",
    react: "text/typescript",
    vue: "text/plain",
    svelte: "text/plain",
    python: "text/x-python",
    javascript: "text/javascript",
    typescript: "text/typescript",
    css: "text/css",
    json: "application/json",
    yaml: "text/yaml",
    markdown: "text/markdown",
    text: "text/plain",
  }

  return mimeMap[artifact.type] || "text/plain"
}

/**
 * Download artifact as a file
 */
export async function downloadArtifact(artifact: Artifact): Promise<void> {
  try {
    const extension = getFileExtension(artifact)
    const mimeType = getMimeType(artifact)
    const titleHasExtension = artifact.title?.includes(".")
    const fileName = artifact.title
      ? titleHasExtension ? artifact.title : `${artifact.title}.${extension}`
      : `artifact-${artifact.id.slice(0, 8)}.${extension}`

    // Create blob with proper MIME type
    const blob = new Blob([artifact.content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    // Create temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)

    toast.success("File downloaded successfully", {
      description: fileName,
    })
  } catch (error) {
    console.error("Download failed:", error)
    toast.error("Failed to download file", {
      description: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * Copy artifact content to clipboard
 */
export async function copyToClipboard(content: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  } catch (error) {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea")
      textarea.value = content
      textarea.style.position = "fixed"
      textarea.style.left = "-999999px"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)

      toast.success("Copied to clipboard")
    } catch (fallbackError) {
      console.error("Copy failed:", fallbackError)
      toast.error("Failed to copy to clipboard")
    }
  }
}

/**
 * Share artifact (generate shareable link)
 * For MVP, this just copies the artifact ID to clipboard
 * In production, this would generate a proper share link
 */
export async function shareArtifact(artifact: Artifact): Promise<void> {
  try {
    // For MVP: Copy artifact URL to clipboard
    // In production: POST to /api/artifacts/:id/share to generate public link
    const shareUrl = `${window.location.origin}/artifacts/${artifact.id}`

    await navigator.clipboard.writeText(shareUrl)

    toast.success("Share link copied", {
      description: "Link copied to clipboard",
    })
  } catch (error) {
    console.error("Share failed:", error)
    toast.error("Failed to create share link")
  }
}

/**
 * Format artifact size (bytes to human readable)
 */
export function formatArtifactSize(content: string): string {
  const bytes = new Blob([content]).size
  const kb = bytes / 1024

  if (kb < 1) {
    return `${bytes} B`
  } else if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  } else {
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }
}

/**
 * Get Monaco language for artifact type
 */
export function getMonacoLanguage(artifact: Artifact): string {
  const languageMap: Record<string, string> = {
    html: "html",
    react: "typescript",
    vue: "html",
    svelte: "html",
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
    css: "css",
    json: "json",
    yaml: "yaml",
    markdown: "markdown",
    text: "plaintext",
  }

  return languageMap[artifact.type] || artifact.language || "plaintext"
}

/**
 * Get icon name for artifact type (Lucide icons)
 */
export function getArtifactIcon(type: string): string {
  const iconMap: Record<string, string> = {
    html: "FileCode",
    react: "Component",
    vue: "FileCode",
    svelte: "FileCode",
    python: "FileCode",
    javascript: "FileCode",
    typescript: "FileCode",
    css: "Palette",
    json: "Braces",
    yaml: "FileText",
    markdown: "FileText",
    text: "FileText",
  }

  return iconMap[type] || "File"
}

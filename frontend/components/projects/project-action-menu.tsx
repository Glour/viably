"use client"

import { useRouter } from "next/navigation"
import { MoreVertical, ExternalLink, Copy, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectActionMenuProps {
  projectId: string
  projectName: string
  onDelete: (id: string) => void
}

export function ProjectActionMenu({
  projectId,
  projectName,
  onDelete,
}: ProjectActionMenuProps) {
  const router = useRouter()

  function handleDuplicate() {
    toast.info("Дублирование проектов скоро будет доступно")
  }

  function handleDownload() {
    toast.info("Скачивание начато...")
  }

  return (
    <DropdownMenu>
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Действия для ${projectName}`}>
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/projects/${projectId}`)}>
          <ExternalLink />
          Открыть
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy />
          Дублировать
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload}>
          <Download />
          Скачать ZIP
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(projectId)}>
          <Trash2 />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

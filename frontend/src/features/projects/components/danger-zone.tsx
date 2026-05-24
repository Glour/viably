"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog"

/* ------------------------------------------------------------------ */
/*  DangerZone                                                          */
/* ------------------------------------------------------------------ */

interface DangerZoneProps {
  projectName: string
  onDelete: () => void
}

export function DangerZone({ projectName, onDelete }: DangerZoneProps) {
  return (
    <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-6">
      <h3 className="font-heading text-lg font-semibold text-destructive">
        Зона опасности
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Это действие нельзя отменить. Проект будет удалён навсегда, а развёрнутый
        бот будет остановлен.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-4">
            <Trash2 className="size-4 mr-2" />
            Удалить проект
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Удалить &ldquo;{projectName}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Проект и все связанные данные будут
              удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={onDelete}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

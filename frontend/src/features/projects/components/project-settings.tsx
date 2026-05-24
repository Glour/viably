"use client"

import { toast } from "sonner"
import { RefreshCw, Download } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { EnvVarEditor } from "./env-var-editor"
import { DangerZone } from "./danger-zone"
import type { Project } from "@/shared/types"

/* ------------------------------------------------------------------ */
/*  ProjectSettings                                                     */
/* ------------------------------------------------------------------ */

interface ProjectSettingsProps {
  project: Project
  onToggleStatus: (action: "start" | "stop") => void
  onDelete: () => void
}

export function ProjectSettings({
  project,
  onToggleStatus,
  onDelete,
}: ProjectSettingsProps) {
  const isRunning = project.status === "deployed"

  return (
    <div className="space-y-8 pt-6">
      {/* Environment Variables */}
      <section>
        <h3 className="font-heading text-lg font-semibold mb-4">
          Переменные окружения
        </h3>
        <EnvVarEditor initialVars={project.envVars} />
      </section>

      {/* Actions */}
      <section>
        <h3 className="font-heading text-lg font-semibold mb-4">Действия</h3>
        <div className="space-y-4">
          {/* Start / Stop toggle */}
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <Label>Бот {isRunning ? "запущен" : "остановлен"}</Label>
              <p className="text-sm text-muted-foreground">
                {isRunning
                  ? "Бот активен и обрабатывает сообщения"
                  : "Бот остановлен"}
              </p>
            </div>
            <Switch
              checked={isRunning}
              onCheckedChange={(checked) =>
                onToggleStatus(checked ? "start" : "stop")
              }
            />
          </div>

          {/* Redeploy + Download */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => toast.info("Редеплой запущен...")}
            >
              <RefreshCw className="size-4 mr-2" />
              Редеплоить
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.info("Скачивание начато...")}
            >
              <Download className="size-4 mr-2" />
              Скачать код
            </Button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <DangerZone projectName={project.name} onDelete={onDelete} />
    </div>
  )
}

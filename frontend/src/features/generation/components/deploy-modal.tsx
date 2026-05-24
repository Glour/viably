"use client"

import { useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/shared/api/query-keys"
import { AnimatePresence, motion } from "motion/react"
import {
  Eye,
  EyeOff,
  Rocket,
  Download,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Database,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { DeployProgress } from "./deploy-progress"
import { DeploySuccess } from "./deploy-success"
import { CustomDomainPanel } from "./custom-domain-panel"
import { useDeploy } from "@/shared/hooks"
import { useProject } from "@/shared/hooks/use-projects"
import { prefersReducedMotion } from "@/shared/lib/animations"
import { useComponentCleanup } from "@/shared/hooks/useComponentCleanup"

interface DeployModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onDownload: () => void
  isWebProject?: boolean
}

export function DeployModal({
  open,
  onOpenChange,
  projectId,
  onDownload,
  isWebProject = false,
}: DeployModalProps) {
  const queryClient = useQueryClient()

  // Refetch fresh project data every time modal opens
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    }
    prevOpen.current = open
  }, [open, projectId, queryClient])

  // Load project data to check existing deployment
  const { data: project } = useProject(projectId)

  // Use real deploy hook
  const deployment = useDeploy(projectId)
  const { registerResource } = useComponentCleanup('DeployModal')

  const [botToken, setBotToken] = useState("")
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [showToken, setShowToken] = useState(false)
  const [subdomain, setSubdomain] = useState("")
  const [useAutoDatabase, setUseAutoDatabase] = useState(true)

  // Check if project is already deployed — has deployedUrl regardless of current status
  // (status can be "ready" after code changes, but URL persists from previous deploy)
  const isAlreadyDeployed = !!project?.deployedUrl
  const existingUrl = project?.deployedUrl || null
  const deployedAt = project?.deployedAt || null

  // T054: Trigger confetti on success with dynamic import
  useEffect(() => {
    if (deployment.status === "success" && !prefersReducedMotion()) {
      // T054: Dynamic import - only load confetti when needed
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true,
        })

        // Register confetti as a resource with cleanup
        registerResource({
          type: 'custom',
          createdAt: Date.now(),
          disposeFn: () => {
            // Reset confetti to remove any canvas elements
            confetti.reset()
          },
          metadata: { library: 'canvas-confetti', action: 'deploy-success' }
        })
      })
    }
  }, [deployment.status, registerResource])

  // Handle deployment start
  const handleDeploy = async () => {
    if (isWebProject) {
      await deployment.startDeploy({
        DEPLOY_TYPE: "website",
        SUBDOMAIN: subdomain,
        ...envVars,
      })
    } else {
      await deployment.startDeploy({
        TELEGRAM_BOT_TOKEN: botToken,
        ...envVars,
      })
    }
  }

  // Handle re-deploy (for already deployed projects)
  // Extract existing subdomain from URL (e.g. "my-site" from "https://my-site.viably.app")
  const existingSubdomain = existingUrl
    ? existingUrl.replace(/^https?:\/\//, "").split(".")[0]
    : ""

  const handleRedeploy = async () => {
    await deployment.startDeploy({
      DEPLOY_TYPE: isWebProject ? "website" : "bot",
      ...(isWebProject && existingSubdomain ? { SUBDOMAIN: existingSubdomain } : {}),
      ...(!isWebProject && botToken ? { TELEGRAM_BOT_TOKEN: botToken } : {}),
      ...envVars,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (deployment.status !== "deploying") onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[520px] max-md:top-0 max-md:left-0 max-md:translate-x-0 max-md:translate-y-0 max-md:h-full max-md:max-h-full max-md:rounded-none max-md:border-0 max-md:max-w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {deployment.status === "idle" && (
              isAlreadyDeployed 
                ? "Управление развёртыванием" 
                : (isWebProject ? "Опубликовать сайт" : "Развернуть бота")
            )}
            {deployment.status === "deploying" && "Развёртывание..."}
            {deployment.status === "success" && "Готово!"}
            {deployment.status === "error" && "Ошибка"}
          </DialogTitle>
          {deployment.status === "idle" && !isAlreadyDeployed && (
            <DialogDescription className="font-body">
              {isWebProject
                ? "Выберите адрес для публикации вашего сайта"
                : "Введите токен бота для автоматического развёртывания"}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={deployment.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Phase 1a: Already deployed - show status */}
            {deployment.status === "idle" && isAlreadyDeployed && (
              <>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                    <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-heading font-semibold text-success">
                        Проект развёрнут
                      </h3>
                      <p className="text-sm font-body text-success/80 mt-1 break-all">
                        {existingUrl}
                      </p>
                      {deployedAt && (
                        <p className="text-xs font-body text-muted-foreground mt-2">
                          Развёрнут: {new Date(deployedAt).toLocaleString('ru-RU')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bot token + DB URL inputs for re-deploy */}
                  {!isWebProject && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="bot-token-redeploy" className="font-body">Токен бота</Label>
                        <div className="relative">
                          <Input
                            id="bot-token-redeploy"
                            type={showToken ? "text" : "password"}
                            placeholder="Сохранён с прошлого деплоя"
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowToken(!showToken)}
                            type="button"
                          >
                            {showToken ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs font-body text-muted-foreground">
                          Оставьте пустым — используется токен из предыдущего деплоя. Введите новый, чтобы заменить.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-body flex items-center gap-2">
                            <Database className="size-4" />
                            База данных
                          </Label>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={useAutoDatabase}
                            onClick={() => setUseAutoDatabase(!useAutoDatabase)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                              useAutoDatabase ? "bg-primary" : "bg-muted"
                            }`}
                          >
                            <span
                              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                                useAutoDatabase ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {useAutoDatabase ? (
                          <div className="flex gap-2 rounded-lg bg-emerald-500/10 p-3">
                            <Database className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-body text-emerald-500">
                              Автоматическая БД — таблицы создаются при запуске.
                            </p>
                          </div>
                        ) : (
                          <Input
                            id="database-url-redeploy"
                            type="text"
                            placeholder="postgresql://user:pass@host:5432/dbname"
                            value={envVars.DATABASE_URL || ""}
                            onChange={(e) =>
                              setEnvVars((prev) => ({ ...prev, DATABASE_URL: e.target.value }))
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 rounded-lg bg-blue-500/10 p-3">
                    <Rocket className="size-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-body text-blue-500">
                      Re-deploy обновит код с последними изменениями. Токен и база данных подтянутся автоматически.
                    </p>
                  </div>

                  {/* Custom domain panel — only for website deployments */}
                  {isWebProject && (
                    <CustomDomainPanel
                      projectId={projectId}
                      subdomainUrl={existingUrl}
                    />
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  {existingUrl && (
                    <Button
                      variant="ghost"
                      onClick={() => window.open(existingUrl, "_blank")}
                      className="gap-2 font-body"
                    >
                      <ExternalLink className="size-4" />
                      Открыть
                    </Button>
                  )}
                  <Button
                    onClick={handleRedeploy}
                    className="gap-2 font-heading font-semibold bg-[image:var(--gradient-main)] hover:brightness-110"
                  >
                    <RefreshCw className="size-4" />
                    Re-deploy
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Phase 1b: First deploy - config form */}
            {deployment.status === "idle" && !isAlreadyDeployed && (
              <>
                <div className="space-y-4">
                  {isWebProject ? (
                    /* Website deploy flow */
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="subdomain" className="font-body">Поддомен сайта</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="subdomain"
                            type="text"
                            placeholder="my-site"
                            value={subdomain}
                            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">.viably.app</span>
                        </div>
                        <p className="text-xs font-body text-muted-foreground">
                          Ваш сайт будет доступен по адресу {subdomain || "my-site"}.viably.app
                        </p>
                      </div>

                      <div className="flex gap-2 rounded-lg bg-blue-500/10 p-3">
                        <Rocket className="size-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-body text-blue-500">
                          Сайт будет развёрнут на хостинге с бесплатным SSL-сертификатом.
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Bot deploy flow */
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="bot-token" className="font-body">Токен бота</Label>
                        <div className="relative">
                          <Input
                            id="bot-token"
                            type={showToken ? "text" : "password"}
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowToken(!showToken)}
                            type="button"
                          >
                            {showToken ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs font-body text-muted-foreground">
                          Получите токен у @BotFather в Telegram
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-body flex items-center gap-2">
                            <Database className="size-4" />
                            База данных
                          </Label>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={useAutoDatabase}
                            onClick={() => setUseAutoDatabase(!useAutoDatabase)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                              useAutoDatabase ? "bg-primary" : "bg-muted"
                            }`}
                          >
                            <span
                              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                                useAutoDatabase ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {useAutoDatabase ? (
                          <div className="flex gap-2 rounded-lg bg-emerald-500/10 p-3">
                            <Database className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-body text-emerald-500">
                              БД создаётся автоматически. Таблицы будут созданы при первом запуске бота.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              id="database-url"
                              type="text"
                              placeholder="postgresql://user:pass@host:5432/dbname"
                              value={envVars.DATABASE_URL || ""}
                              onChange={(e) =>
                                setEnvVars((prev) => ({ ...prev, DATABASE_URL: e.target.value }))
                              }
                            />
                            <p className="text-xs font-body text-muted-foreground">
                              Supabase, Neon или другой PostgreSQL.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 rounded-lg bg-amber-500/10 p-3">
                        <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-body text-amber-500">
                          Токен используется только для развёртывания.
                          Мы не храним ваши данные.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button
                    onClick={handleDeploy}
                    disabled={isWebProject ? !subdomain.trim() : (!botToken.trim() || (!useAutoDatabase && !envVars.DATABASE_URL?.trim()))}
                    className="gap-2 font-heading font-semibold bg-[image:var(--gradient-main)] hover:brightness-110"
                  >
                    <Rocket className="size-4" />
                    {isWebProject ? "Опубликовать" : "Развернуть"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Phase 2: Deploying */}
            {deployment.status === "deploying" && (
              <DeployProgress
                steps={deployment.steps}
                progress={deployment.progress}
              />
            )}

            {/* Phase 3a: Success */}
            {deployment.status === "success" && deployment.deploymentInfo && (
              <>
                <DeploySuccess
                  botInfo={{
                    username: deployment.deploymentInfo.botUsername,
                    url: isWebProject
                      ? deployment.deploymentInfo.url
                      : deployment.deploymentInfo.botUrl,
                    status: "running",
                  }}
                  isWebProject={isWebProject}
                  onOpenTelegram={() => {
                    const target = isWebProject
                      ? deployment.deploymentInfo!.url
                      : deployment.deploymentInfo!.botUrl
                    if (target) window.open(target, "_blank")
                  }}
                  onBackToProjects={() => onOpenChange(false)}
                />
                {/* Custom domain panel — shown after successful website deploy */}
                {isWebProject && (
                  <div className="mt-4">
                    <CustomDomainPanel
                      projectId={projectId}
                      subdomainUrl={deployment.deploymentInfo.url}
                    />
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                </DialogFooter>
              </>
            )}

            {/* Phase 3b: Error */}
            {deployment.status === "error" && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <AlertTriangle className="size-5 text-destructive shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-heading font-semibold text-destructive">
                        Ошибка развёртывания
                      </h3>
                      <p className="text-sm font-body text-destructive/80 mt-1">
                        {deployment.error || "Неизвестная ошибка"}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button
                    onClick={deployment.retryDeploy}
                    className="gap-2 font-body"
                  >
                    <RefreshCw className="size-4" />
                    Попробовать снова
                  </Button>
                </DialogFooter>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

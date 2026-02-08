"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import confetti from "canvas-confetti"
import {
  Eye,
  EyeOff,
  Rocket,
  Download,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DeployProgress } from "./deploy-progress"
import { DeploySuccess } from "./deploy-success"
import { useDeploy } from "@/lib/hooks/use-deploy"
import { prefersReducedMotion } from "@/lib/animations"

interface DeployModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onDownload: () => void
}

export function DeployModal({
  open,
  onOpenChange,
  projectId,
  onDownload,
}: DeployModalProps) {
  // Use real deploy hook
  const deployment = useDeploy(projectId)

  const [botToken, setBotToken] = useState("")
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [showToken, setShowToken] = useState(false)

  // T047: Trigger confetti on success
  useEffect(() => {
    if (deployment.status === "success" && !prefersReducedMotion()) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
      })
    }
  }, [deployment.status])

  // Handle deployment start
  const handleDeploy = async () => {
    await deployment.startDeploy({
      TELEGRAM_BOT_TOKEN: botToken,
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
      <DialogContent className="sm:max-w-[520px] max-md:h-full max-md:max-h-full max-md:rounded-none max-md:border-0 max-md:translate-y-0 max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom">
        <DialogHeader>
          <DialogTitle>
            {deployment.status === "idle" && "Развернуть бота"}
            {deployment.status === "deploying" && "Развёртывание..."}
            {deployment.status === "success" && "Готово!"}
            {deployment.status === "error" && "Ошибка"}
          </DialogTitle>
          {deployment.status === "idle" && (
            <DialogDescription>
              Введите токен бота для автоматического развёртывания
            </DialogDescription>
          )}
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={deployment.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Phase 1: Config */}
            {deployment.status === "idle" && (
              <>
                <div className="space-y-4">
                  {/* Bot token input with show/hide toggle */}
                  <div className="space-y-2">
                    <Label htmlFor="bot-token">Токен бота</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Получите токен у @BotFather в Telegram
                    </p>
                  </div>

                  {/* Additional env vars (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="database-url">Database URL (опционально)</Label>
                    <Input
                      id="database-url"
                      type="text"
                      placeholder="postgresql://..."
                      value={envVars.DATABASE_URL || ""}
                      onChange={(e) =>
                        setEnvVars((prev) => ({ ...prev, DATABASE_URL: e.target.value }))
                      }
                    />
                  </div>

                  {/* Warning text */}
                  <div className="flex gap-2 rounded-lg bg-amber-500/10 p-3">
                    <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-500">
                      Токен будет использован только для развёртывания. Мы не
                      храним ваши токены.
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button
                    variant="ghost"
                    onClick={onDownload}
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    Скачать ZIP
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    disabled={!botToken.trim()}
                    className="gap-2 bg-[image:var(--gradient-main)] hover:brightness-110"
                  >
                    <Rocket className="size-4" />
                    Развернуть
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
                    url: deployment.deploymentInfo.botUrl,
                    status: "running",
                  }}
                  onOpenTelegram={() =>
                    window.open(deployment.deploymentInfo!.botUrl, "_blank")
                  }
                  onBackToProjects={() => onOpenChange(false)}
                />
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button
                    variant="ghost"
                    onClick={onDownload}
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    Скачать ZIP
                  </Button>
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
                      <h3 className="text-sm font-semibold text-destructive">
                        Ошибка развёртывания
                      </h3>
                      <p className="text-sm text-destructive/80 mt-1">
                        {deployment.error || "Неизвестная ошибка"}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button
                    variant="ghost"
                    onClick={onDownload}
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    Скачать ZIP
                  </Button>
                  <Button
                    onClick={deployment.retryDeploy}
                    className="gap-2"
                  >
                    <RefreshCw className="size-4" />
                    Попробовать снова
                  </Button>
                </DialogFooter>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

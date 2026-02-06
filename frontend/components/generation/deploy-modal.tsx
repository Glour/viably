"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
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
import type { DeploymentSession, DeployConfig } from "@/types"

interface DeployModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deployment: DeploymentSession
  onDeploy: (config: DeployConfig) => void
  onDownload: () => void
}

export function DeployModal({
  open,
  onOpenChange,
  deployment,
  onDeploy,
  onDownload,
}: DeployModalProps) {
  const [botToken, setBotToken] = useState("")
  const [showToken, setShowToken] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (deployment.status !== "deploying") onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {deployment.status === "config" && "Развернуть бота"}
            {deployment.status === "deploying" && "Развёртывание..."}
            {deployment.status === "success" && "Готово!"}
            {deployment.status === "failure" && "Ошибка"}
          </DialogTitle>
          {deployment.status === "config" && (
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
            {deployment.status === "config" && (
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
                    onClick={() => onDeploy({ botToken, envVars: {} })}
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
            {deployment.status === "success" && deployment.botInfo && (
              <DeploySuccess
                botInfo={deployment.botInfo}
                onOpenTelegram={() =>
                  window.open(deployment.botInfo!.url, "_blank")
                }
                onBackToProjects={() => onOpenChange(false)}
              />
            )}

            {/* Phase 3b: Failure */}
            {deployment.status === "failure" && (
              <>
                <div className="space-y-4 text-center">
                  <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <AlertTriangle className="size-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Ошибка развёртывания
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {deployment.error || "Неизвестная ошибка"}
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
                    onClick={() => onDeploy({ botToken, envVars: {} })}
                    disabled={!botToken.trim()}
                    className="gap-2"
                  >
                    <RefreshCw className="size-4" />
                    Повторить
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

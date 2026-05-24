"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ListChecks } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useConversationStore } from "../stores/conversation-store"

export function PlanCard() {
  const plan = useConversationStore((s) => s.plan)

  if (!plan) return null

  return (
    <Card className="mx-4 mb-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-primary">
          <ListChecks className="h-4 w-4" />
          План генерации
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 text-sm text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {plan}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import Link from "next/link"
import {
  MessageSquare,
  Send,
  Hash,
  MessageCircle,
  Code,
  Clock,
  Target,
  Sparkles,
  DollarSign,
  Coins,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TemplateInfo {
  name: string
  slug: string
  icon: React.ComponentType<{ className?: string }>
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  setupTime: string
  bestFor: string[]
  keyFeatures: string[]
  apiCost: string
  creditCost: number
}

const templates: TemplateInfo[] = [
  {
    name: "Discord Bot",
    slug: "discord",
    icon: MessageSquare,
    difficulty: "Beginner",
    setupTime: "10 minutes",
    bestFor: ["Gaming communities", "Moderation", "Custom commands"],
    keyFeatures: [
      "Slash commands",
      "Rich embeds",
      "Event handlers",
      "Role management",
    ],
    apiCost: "Free",
    creditCost: 10,
  },
  {
    name: "Telegram Bot",
    slug: "telegram",
    icon: Send,
    difficulty: "Beginner",
    setupTime: "10 minutes",
    bestFor: ["Personal assistants", "Notifications", "File sharing"],
    keyFeatures: [
      "Commands",
      "Inline keyboards",
      "File uploads",
      "Webhooks",
    ],
    apiCost: "Free",
    creditCost: 10,
  },
  {
    name: "Slack Bot",
    slug: "slack",
    icon: Hash,
    difficulty: "Intermediate",
    setupTime: "20 minutes",
    bestFor: ["Workplace automation", "Team tools", "Integrations"],
    keyFeatures: [
      "Slash commands",
      "Interactive messages",
      "Workflows",
      "OAuth",
    ],
    apiCost: "Free tier available",
    creditCost: 10,
  },
  {
    name: "WhatsApp Bot",
    slug: "whatsapp",
    icon: MessageCircle,
    difficulty: "Intermediate",
    setupTime: "30 minutes",
    bestFor: ["Customer support", "Business messaging", "Notifications"],
    keyFeatures: [
      "Message templates",
      "Media messages",
      "Quick replies",
      "Business API",
    ],
    apiCost: "Pay per conversation",
    creditCost: 10,
  },
  {
    name: "Custom Bot",
    slug: "custom",
    icon: Code,
    difficulty: "Advanced",
    setupTime: "60 minutes",
    bestFor: ["Any platform", "Complex logic", "Custom integrations"],
    keyFeatures: ["Custom API", "Webhooks", "Full control", "Any platform"],
    apiCost: "Varies",
    creditCost: 10,
  },
]

function getDifficultyVariant(
  difficulty: TemplateInfo["difficulty"]
): "success" | "warning" | "info" {
  switch (difficulty) {
    case "Beginner":
      return "success"
    case "Intermediate":
      return "warning"
    case "Advanced":
      return "info"
    default:
      return "info"
  }
}

export function TemplateComparison() {
  return (
    <div className="not-prose space-y-6">
      {/* Desktop View - Table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <div className="bg-accent/50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold font-heading">
            Template Comparison
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Compare features and requirements across all bot templates
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted/50">
                <th className="text-left font-semibold px-6 py-3 min-w-[140px]">
                  Template
                </th>
                <th className="text-left font-semibold px-6 py-3 min-w-[120px]">
                  Difficulty
                </th>
                <th className="text-left font-semibold px-6 py-3 min-w-[100px]">
                  Setup Time
                </th>
                <th className="text-left font-semibold px-6 py-3 min-w-[200px]">
                  Best For
                </th>
                <th className="text-left font-semibold px-6 py-3 min-w-[200px]">
                  Key Features
                </th>
                <th className="text-left font-semibold px-6 py-3 min-w-[140px]">
                  API Cost
                </th>
                <th className="text-left font-semibold px-6 py-3 min-w-[100px]">
                  Credits
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const Icon = template.icon
                return (
                  <tr
                    key={template.slug}
                    className="border-b last:border-0 hover:bg-accent/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/docs/templates/${template.slug}`}
                        className="flex items-center gap-3 font-medium group-hover:text-primary transition-colors"
                      >
                        <div className="rounded-lg bg-primary-subtle p-2 group-hover:bg-primary/20 transition-colors shrink-0">
                          <Icon className="size-4 text-primary" />
                        </div>
                        <span>{template.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={getDifficultyVariant(template.difficulty)}
                        className="whitespace-nowrap"
                      >
                        {template.difficulty}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 shrink-0" />
                        <span className="whitespace-nowrap">
                          {template.setupTime}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {template.bestFor.map((item) => (
                          <Badge
                            key={item}
                            variant="outline"
                            className="text-xs whitespace-nowrap"
                          >
                            <Target className="size-3 mr-1" />
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {template.keyFeatures.map((feature) => (
                          <Badge
                            key={feature}
                            variant="secondary"
                            className="text-xs whitespace-nowrap"
                          >
                            <Sparkles className="size-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 shrink-0" />
                        <span className="whitespace-nowrap">
                          {template.apiCost}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="whitespace-nowrap">
                        <Coins className="size-3 mr-1" />
                        {template.creditCost}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold font-heading">
            Template Comparison
          </h3>
          <p className="text-sm text-muted-foreground">
            Compare features and requirements across all bot templates
          </p>
        </div>

        {templates.map((template) => {
          const Icon = template.icon
          return (
            <Link
              key={template.slug}
              href={`/docs/templates/${template.slug}`}
              className="block"
            >
              <Card className="hover:scale-[1.02] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="rounded-lg bg-primary-subtle p-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <Badge
                      variant={getDifficultyVariant(template.difficulty)}
                      className="shrink-0"
                    >
                      {template.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Clock className="size-4" />
                    {template.setupTime} setup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Best For */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Target className="size-3" />
                      Best For
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.bestFor.map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="text-xs"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="size-3" />
                      Key Features
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.keyFeatures.map((feature) => (
                        <Badge
                          key={feature}
                          variant="secondary"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Costs */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="size-4" />
                      <span>{template.apiCost}</span>
                    </div>
                    <Badge variant="secondary">
                      <Coins className="size-3 mr-1" />
                      {template.creditCost} credits
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

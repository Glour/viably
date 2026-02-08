import type { Metadata } from "next"
import Link from "next/link"
import {
  MessageSquare,
  Send,
  Hash,
  MessageCircle,
  Code,
  BookOpen,
  ArrowRight,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Bot Templates | Viably Documentation",
  description: "Explore Viably bot templates for Discord, Telegram, Slack, WhatsApp, and custom integrations. Find the perfect template for your needs.",
}

interface Template {
  name: string
  slug: string
  icon: React.ComponentType<{ className?: string }>
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  description: string
  features: string[]
}

const templates: Template[] = [
  {
    name: "Discord Bot",
    slug: "discord",
    icon: MessageSquare,
    difficulty: "Beginner",
    description: "Create custom Discord bots with slash commands, events, and rich embeds.",
    features: ["Slash Commands", "Event Handlers", "Rich Embeds", "Role Management"],
  },
  {
    name: "Telegram Bot",
    slug: "telegram",
    icon: Send,
    difficulty: "Beginner",
    description: "Build Telegram bots with inline keyboards, commands, and message handling.",
    features: ["Inline Keyboards", "Commands", "File Uploads", "Webhooks"],
  },
  {
    name: "Slack Bot",
    slug: "slack",
    icon: Hash,
    difficulty: "Intermediate",
    description: "Develop Slack apps with interactive messages, slash commands, and workflows.",
    features: ["Slash Commands", "Interactive Messages", "Workflows", "OAuth"],
  },
  {
    name: "WhatsApp Bot",
    slug: "whatsapp",
    icon: MessageCircle,
    difficulty: "Intermediate",
    description: "Create WhatsApp Business bots with message templates and media support.",
    features: ["Message Templates", "Media Messages", "Quick Replies", "Business API"],
  },
  {
    name: "Custom Bot",
    slug: "custom",
    icon: Code,
    difficulty: "Advanced",
    description: "Build fully custom bots with your own API endpoints and integrations.",
    features: ["Custom API", "Webhooks", "Full Control", "Any Platform"],
  },
  {
    name: "Template Guide",
    slug: "guide",
    icon: BookOpen,
    difficulty: "Beginner",
    description: "Learn how to choose, customize, and deploy the right template for your needs.",
    features: ["Comparison", "Best Practices", "Customization", "Deployment"],
  },
]

function getDifficultyVariant(difficulty: Template["difficulty"]) {
  switch (difficulty) {
    case "Beginner":
      return "success"
    case "Intermediate":
      return "warning"
    case "Advanced":
      return "info"
    default:
      return "default"
  }
}

export default function TemplatesPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold font-heading">Bot Templates</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Get started quickly with our pre-built bot templates. Each template is designed for specific platforms and use cases, providing you with a solid foundation to build upon.
        </p>
      </div>

      {/* Template Comparison Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-accent/50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold font-heading">Quick Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-semibold px-6 py-3">Template</th>
                <th className="text-left font-semibold px-6 py-3">Platform</th>
                <th className="text-left font-semibold px-6 py-3">Difficulty</th>
                <th className="text-left font-semibold px-6 py-3">Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium">Discord Bot</td>
                <td className="px-6 py-4 text-muted-foreground">Discord</td>
                <td className="px-6 py-4">
                  <Badge variant="success">Beginner</Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">Gaming communities, moderation</td>
              </tr>
              <tr className="border-b hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium">Telegram Bot</td>
                <td className="px-6 py-4 text-muted-foreground">Telegram</td>
                <td className="px-6 py-4">
                  <Badge variant="success">Beginner</Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">Personal assistants, notifications</td>
              </tr>
              <tr className="border-b hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium">Slack Bot</td>
                <td className="px-6 py-4 text-muted-foreground">Slack</td>
                <td className="px-6 py-4">
                  <Badge variant="warning">Intermediate</Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">Workplace automation, team tools</td>
              </tr>
              <tr className="border-b hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium">WhatsApp Bot</td>
                <td className="px-6 py-4 text-muted-foreground">WhatsApp</td>
                <td className="px-6 py-4">
                  <Badge variant="warning">Intermediate</Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">Customer support, business</td>
              </tr>
              <tr className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium">Custom Bot</td>
                <td className="px-6 py-4 text-muted-foreground">Any</td>
                <td className="px-6 py-4">
                  <Badge variant="info">Advanced</Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">Custom platforms, specific needs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Cards Grid */}
      <div>
        <h2 className="text-2xl font-semibold font-heading mb-6">Explore Templates</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 not-prose">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <Link
                key={template.slug}
                href={`/docs/templates/${template.slug}`}
                className="group"
              >
                <Card className="h-full transition-all duration-300 hover:scale-[1.02]">
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
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Key Features
                      </p>
                      <ul className="grid grid-cols-2 gap-2">
                        {template.features.map((feature) => (
                          <li
                            key={feature}
                            className="text-sm text-muted-foreground flex items-center gap-1.5"
                          >
                            <span className="size-1 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium pt-2">
                      Learn More
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-accent/50 rounded-lg p-8 border">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold font-heading mb-3">
            Need Help Choosing?
          </h2>
          <p className="text-muted-foreground mb-6">
            Not sure which template is right for your project? Check out our comprehensive guide to learn about the differences between platforms, common use cases, and how to customize templates to fit your needs.
          </p>
          <Button asChild size="lg">
            <Link href="/docs/templates/guide" className="gap-2">
              <BookOpen className="size-4" />
              Read the Template Guide
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

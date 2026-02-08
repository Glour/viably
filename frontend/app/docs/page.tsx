import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to build AI-powered bots with Viably",
}

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-heading mb-4">
          Welcome to Viably Documentation
        </h1>
        <p className="text-lg text-muted-foreground">
          Learn how to build and deploy AI-powered bots in minutes with our comprehensive guides and templates.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 not-prose">
        <Link href="/docs/quickstart" className="group">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors h-full">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              Quick Start Guide
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started with Viably in less than 5 minutes. Create your first bot and deploy it.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              Start building
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/docs/templates/guide" className="group">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors h-full">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              Template Guide
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Explore pre-built templates for Discord, Telegram, Slack, and more platforms.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              Browse templates
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-accent/50 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-3">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Can't find what you're looking for? Check out our community resources or contact support.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="https://github.com/viably/viably/discussions" target="_blank">
              Community
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="mailto:support@viably.com">
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

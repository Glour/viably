import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/ui/hero-background";
import { siteContent } from "@/content/site";

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden px-4 pb-20 pt-16 md:px-6 md:pb-24 md:pt-24">
      <HeroBackground variant="gradient-sweep" palette="blue" animated intensity="medium" />
      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">{siteContent.hero.badge}</Badge>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">{siteContent.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{siteContent.hero.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="btn-gradient">
              {siteContent.hero.primaryAction}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline">{siteContent.hero.secondaryAction}</Button>
          </div>
        </div>

        <div className="card-glass rounded-[28px] border border-border/60 p-6 shadow-2xl shadow-primary/10">
          <p className="text-sm font-medium text-muted-foreground">{siteContent.hero.panelTitle}</p>
          <div className="mt-5 space-y-3">
            {siteContent.hero.bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/80 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

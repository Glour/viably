import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteContent } from "@/content/site";

export function CTA() {
  return (
    <section id="cta" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-8 text-center shadow-2xl shadow-primary/10 md:p-14">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{siteContent.cta.eyebrow}</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{siteContent.cta.title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{siteContent.cta.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="btn-gradient">
            {siteContent.cta.primaryAction}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">{siteContent.cta.secondaryAction}</Button>
        </div>
      </div>
    </section>
  );
}

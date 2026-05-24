import { Layers3, LayoutTemplate, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteContent } from "@/content/site";

const icons = {
  layout: LayoutTemplate,
  wand: Wand2,
  layers: Layers3,
} as const;

export function Features() {
  return (
    <section id="features" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{siteContent.features.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{siteContent.features.title}</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {siteContent.features.items.map((feature) => {
            const Icon = icons[feature.icon];
            return (
              <Card key={feature.title} className="h-full rounded-[24px] border-border/60 bg-card/90">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.text}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">{feature.detail}</CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { siteContent } from "@/content/site";

export function Metrics() {
  return (
    <section id="metrics" className="border-y border-border/50 bg-card/30 px-4 py-10 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {siteContent.metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-border/50 bg-background/70 p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold tracking-tight md:text-4xl">{metric.value}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

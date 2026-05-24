import { Button } from "@/components/ui/button";
import { siteContent } from "@/content/site";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <a href="#hero" className="text-lg font-semibold tracking-tight">
          {siteContent.brand.name}
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {siteContent.brand.nav.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <Button variant="outline">{siteContent.brand.primaryAction}</Button>
      </div>
    </header>
  );
}

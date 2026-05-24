import { siteContent } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>{siteContent.footer.note}</p>
        <div className="flex gap-4">
          {siteContent.footer.links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

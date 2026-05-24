"use client"

import { memo, useEffect, useRef } from "react"
import { cn } from "@/shared/lib/utils"

export interface HTMLPreviewProps {
  html: string
  className?: string
  onNavigate?: (filename: string) => void
}

// Script injected into iframe to intercept internal link clicks
const NAV_INTERCEPTOR = `
<script>
(function() {
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el) return;
    var href = el.getAttribute('href');
    if (!href) return;
    // Skip anchors, external links, mailto, tel
    if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
    e.preventDefault();
    window.parent.postMessage({ type: 'preview-navigate', href: href }, '*');
  });
})();
</script>
`

export const HTMLPreview = memo(function HTMLPreview({ html, className, onNavigate }: HTMLPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!onNavigate) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "preview-navigate" && e.data.href) {
        onNavigate(e.data.href)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [onNavigate])

  const noScrollCSS = '<style>::-webkit-scrollbar{width:0!important;height:0!important;background:transparent!important}html,body,*{scrollbar-width:none!important;-ms-overflow-style:none!important}</style>'

  let injectedHtml = html
  // Inject scroll-hide CSS
  injectedHtml = injectedHtml.includes('</head>')
    ? injectedHtml.replace('</head>', noScrollCSS + '</head>')
    : noScrollCSS + injectedHtml
  // Inject navigation interceptor before </body> or at end
  injectedHtml = injectedHtml.includes('</body>')
    ? injectedHtml.replace('</body>', NAV_INTERCEPTOR + '</body>')
    : injectedHtml + NAV_INTERCEPTOR

  return (
    <iframe
      ref={iframeRef}
      srcDoc={injectedHtml}
      className={cn("w-full h-full border-0", className)}
      sandbox="allow-scripts allow-same-origin"
      title="Preview"
    />
  )
})

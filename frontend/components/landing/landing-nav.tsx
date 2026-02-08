"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const NAV_LINKS = [
  { label: "Demo", href: "#demo", isAnchor: true },
  { label: "Features", href: "#features", isAnchor: true },
  { label: "Pricing", href: "#pricing", isAnchor: true },
  { label: "Docs", href: "/docs", isAnchor: false },
  { label: "Blog", href: "/blog", isAnchor: false },
] as const

const SCROLL_THRESHOLD = 100

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const reduced = useReducedMotion()

  // Track scroll position for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    // Check initial position (e.g. page reload mid-scroll)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string, isAnchor: boolean) => {
      if (!isAnchor) {
        setMobileMenuOpen(false)
        return
      }
      e.preventDefault()
      setMobileMenuOpen(false)
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
      }
    },
    [reduced]
  )

  return (
    <nav
      aria-label="Landing navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        reduced
          ? scrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border/50"
            : "bg-transparent"
          : "transition-all duration-300",
        !reduced && scrolled && "bg-background/80 backdrop-blur-lg border-b border-border/50",
        !reduced && !scrolled && "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-0 shrink-0"
          aria-label="Viably home"
        >
          <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-xl">
            V
          </span>
          <span className="font-heading font-bold text-lg">iably</span>
        </Link>

        {/* Desktop nav links (hidden below md) */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) =>
            link.isAnchor ? (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href, link.isAnchor)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop CTA buttons (hidden below md) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] hover:bg-[position:100%_100%] transition-all duration-300 shadow-[0_0_20px_var(--primary-glow)] hover:shadow-[0_0_30px_var(--primary-glow)]"
          >
            Sign Up &rarr;
          </Link>
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center size-10 rounded-lg text-foreground hover:bg-accent transition-colors"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="landing-mobile-menu"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {reduced ? (
        mobileMenuOpen && (
          <div id="landing-mobile-menu" className="md:hidden">
            <MobileMenuContent
              onAnchorClick={handleAnchorClick}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        )
      ) : (
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="landing-mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <MobileMenuContent
                onAnchorClick={handleAnchorClick}
                onClose={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </nav>
  )
}

function MobileMenuContent({
  onAnchorClick,
  onClose,
}: {
  onAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string, isAnchor: boolean) => void
  onClose: () => void
}) {
  return (
    <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 px-6 py-4 space-y-1">
      {NAV_LINKS.map((link) =>
        link.isAnchor ? (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => onAnchorClick(e, link.href, link.isAnchor)}
            className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {link.label}
          </Link>
        )
      )}
      <div className="h-px bg-border/50 my-3" />
      <Link
        href="/login"
        onClick={onClose}
        className="flex items-center justify-center px-3 py-3 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
      >
        Login
      </Link>
      <Link
        href="/register"
        onClick={onClose}
        className="flex items-center justify-center px-3 py-3 rounded-lg text-sm font-medium text-white bg-[image:var(--gradient-main)] shadow-[0_0_20px_var(--primary-glow)] transition-colors"
      >
        Sign Up &rarr;
      </Link>
    </div>
  )
}

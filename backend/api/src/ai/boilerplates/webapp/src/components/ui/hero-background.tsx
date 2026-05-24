// filename: src/components/ui/hero-background.tsx
/**
 * HeroBackground — plug-and-play animated backgrounds for hero sections.
 *
 * Usage:
 *   <HeroBackground variant="mesh-purple" className="..." />
 *   <HeroBackground variant="dots-float" animated />
 *   <HeroBackground variant="geometric" palette="warm" />
 */

interface HeroBackgroundProps {
  variant?:
    | "mesh-purple" | "mesh-blue" | "mesh-warm" | "mesh-green"
    | "dots" | "grid" | "dots-grid"
    | "geometric" | "orbs" | "noise"
    | "gradient-sweep"
  palette?: "purple" | "blue" | "warm" | "green" | "neutral"
  animated?: boolean
  className?: string
  intensity?: "subtle" | "medium" | "strong"
}

const PALETTE_COLORS: Record<string, { primary: string; secondary: string; tertiary: string }> = {
  purple:  { primary: "hsl(262, 80%, 60%)", secondary: "hsl(220, 85%, 65%)", tertiary: "hsl(300, 70%, 55%)" },
  blue:    { primary: "hsl(200, 90%, 55%)", secondary: "hsl(240, 80%, 65%)", tertiary: "hsl(180, 75%, 50%)" },
  warm:    { primary: "hsl(25,  90%, 58%)", secondary: "hsl(330, 80%, 58%)", tertiary: "hsl(280, 70%, 55%)" },
  green:   { primary: "hsl(140, 80%, 42%)", secondary: "hsl(180, 80%, 48%)", tertiary: "hsl(100, 70%, 40%)" },
  neutral: { primary: "hsl(220, 15%, 50%)", secondary: "hsl(220, 10%, 60%)", tertiary: "hsl(220, 8%,  70%)" },
}

const INTENSITY_OPACITY: Record<string, number> = {
  subtle: 0.12,
  medium: 0.22,
  strong: 0.38,
}

export function HeroBackground({
  variant = "mesh-purple",
  palette = "purple",
  animated = false,
  className = "",
  intensity = "medium",
}: HeroBackgroundProps) {
  const colors = PALETTE_COLORS[palette] || PALETTE_COLORS.purple
  const opacity = INTENSITY_OPACITY[intensity] || 0.22
  const anim = animated ? "animate-pulse" : ""

  // Orbs variant — floating glowing circles
  if (variant === "orbs") {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
        <div
          className={`absolute rounded-full blur-3xl ${animated ? "animate-float" : ""}`}
          style={{
            width: "45%", height: "45%", top: "5%", left: "10%",
            background: colors.primary,
            opacity,
          }}
        />
        <div
          className={`absolute rounded-full blur-3xl ${animated ? "animate-float stagger-2" : ""}`}
          style={{
            width: "35%", height: "40%", top: "30%", right: "8%",
            background: colors.secondary,
            opacity: opacity * 0.8,
          }}
        />
        <div
          className={`absolute rounded-full blur-3xl ${animated ? "animate-float stagger-4" : ""}`}
          style={{
            width: "25%", height: "30%", bottom: "10%", left: "35%",
            background: colors.tertiary,
            opacity: opacity * 0.6,
          }}
        />
      </div>
    )
  }

  // Geometric variant — rotating shapes
  if (variant === "geometric") {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
        <div
          className={`absolute border-2 rounded-3xl ${animated ? "animate-spin-slow" : ""}`}
          style={{
            width: "55vw", height: "55vw", top: "-15vw", right: "-15vw",
            borderColor: `${colors.primary}33`,
          }}
        />
        <div
          className={`absolute border rounded-3xl ${animated ? "animate-spin-slow" : ""}`}
          style={{
            width: "35vw", height: "35vw", bottom: "-10vw", left: "-10vw",
            borderColor: `${colors.secondary}22`,
            animationDirection: "reverse",
            animationDuration: "30s",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: "40%", height: "60%", top: "0", left: "15%",
            background: `radial-gradient(ellipse, ${colors.primary} 0%, transparent 70%)`,
            opacity: opacity * 0.8,
          }}
        />
      </div>
    )
  }

  // Gradient sweep
  if (variant === "gradient-sweep") {
    return (
      <div
        className={`absolute inset-0 pointer-events-none ${animated ? "animate-gradient" : ""} ${className}`}
        aria-hidden="true"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}${Math.round(opacity * 255).toString(16).padStart(2,'0')} 0%, transparent 40%, ${colors.secondary}${Math.round(opacity * 200).toString(16).padStart(2,'0')} 60%, transparent 100%)`,
          backgroundSize: animated ? "200% 200%" : "100% 100%",
        }}
      />
    )
  }

  // Dots / Grid pattern
  if (variant === "dots" || variant === "grid" || variant === "dots-grid") {
    const bgClass = variant === "dots" ? "bg-dots" : variant === "grid" ? "bg-grid" : "bg-dots"
    return (
      <div className={`absolute inset-0 pointer-events-none ${bgClass} ${className}`} aria-hidden="true">
        {/* Fade edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>
    )
  }

  // Default: mesh gradients
  const meshClass: Record<string, string> = {
    "mesh-purple": "bg-mesh-purple",
    "mesh-blue":   "bg-mesh-blue",
    "mesh-warm":   "bg-mesh-warm",
    "mesh-green":  "bg-mesh-green",
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${meshClass[variant] ?? "bg-mesh-purple"} ${className}`}
      aria-hidden="true"
    />
  )
}

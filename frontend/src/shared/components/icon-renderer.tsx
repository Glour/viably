"use client"

import {
  HelpCircle,
  ShoppingCart,
  Bell,
  BarChart3,
  Headphones,
  CalendarCheck,
  Bot,
  Zap,
  Wrench,
  Globe,
  Smartphone,
  Package,
  Sparkles,
  Rocket,
  Gem,
  Lightbulb,
  Briefcase,
  Pencil,
  FileText,
  LayoutDashboard,
  Box,
  type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  "help-circle": HelpCircle,
  "question-mark-circle": HelpCircle,
  "shopping-cart": ShoppingCart,
  "bell": Bell,
  "bar-chart": BarChart3,
  "bar-chart-2": BarChart3,
  "headphones": Headphones,
  "calendar-check": CalendarCheck,
  "bot": Bot,
  "robot": Bot,
  "zap": Zap,
  "wrench": Wrench,
  "globe": Globe,
  "smartphone": Smartphone,
  "package": Package,
  "sparkles": Sparkles,
  "rocket": Rocket,
  "gem": Gem,
  "lightbulb": Lightbulb,
  "briefcase": Briefcase,
  "pencil": Pencil,
  "notebook": FileText,
  "file-text": FileText,
  "layout-dashboard": LayoutDashboard,
  "box": Box,
}

interface IconRendererProps {
  name: string
  className?: string
}

export function IconRenderer({ name, className = "w-10 h-10" }: IconRendererProps) {
  const IconComponent = ICON_MAP[name]
  if (IconComponent) {
    return <IconComponent className={className} />
  }
  // Fallback: generic box icon (no emoji)
  return <Box className={className} />
}

/**
 * Mock Data Generators for Performance Testing
 *
 * Generates large datasets (500+) for testing virtualized lists
 */

import type { Template, Project, TemplateCategory } from "@/shared/types"

/* ------------------------------------------------------------------ */
/*  Template Mock Data                                                 */
/* ------------------------------------------------------------------ */

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "telegram_bot",
  "discord_bot",
  "web_app",
  "api",
  "automation",
]

const TEMPLATE_NAMES = [
  "Customer Support Bot",
  "E-commerce Assistant",
  "FAQ Bot",
  "Order Tracker",
  "Subscription Manager",
  "Notification Service",
  "Analytics Dashboard",
  "Content Moderator",
  "Ticket System",
  "Booking System",
  "Payment Gateway",
  "User Onboarding",
  "Feedback Collector",
  "Survey Bot",
  "Newsletter Manager",
  "Event Scheduler",
  "Task Manager",
  "Time Tracker",
  "Invoice Generator",
  "Report Builder",
]

const TEMPLATE_DESCRIPTIONS = [
  "Automate customer support with AI-powered responses",
  "Manage orders and track deliveries in real-time",
  "Answer frequently asked questions instantly",
  "Handle subscriptions and recurring payments",
  "Send automated notifications to users",
  "Monitor and moderate user-generated content",
  "Collect and analyze user feedback",
  "Schedule appointments and manage calendars",
  "Track tasks and boost team productivity",
  "Generate invoices and financial reports",
]

const TEMPLATE_FEATURES = [
  ["AI-powered responses", "Multi-language support", "24/7 availability"],
  ["Real-time tracking", "Email notifications", "Order history"],
  ["Instant answers", "Knowledge base", "Search functionality"],
  ["Payment processing", "Auto-renewal", "Usage analytics"],
  ["Push notifications", "Email alerts", "SMS integration"],
  ["Auto-moderation", "Spam detection", "User reports"],
  ["Rating system", "Comment analysis", "Export reports"],
  ["Calendar sync", "Reminders", "Timezone support"],
  ["Task assignment", "Progress tracking", "Team collaboration"],
  ["PDF generation", "Email delivery", "Tax calculations"],
]

const TEMPLATE_TAGS = [
  ["support", "ai", "chat"],
  ["ecommerce", "orders", "tracking"],
  ["faq", "knowledge", "search"],
  ["payments", "subscriptions", "billing"],
  ["notifications", "alerts", "messaging"],
  ["moderation", "security", "spam"],
  ["feedback", "analytics", "surveys"],
  ["scheduling", "calendar", "events"],
  ["productivity", "tasks", "teams"],
  ["finance", "invoicing", "reports"],
]

export function generateMockTemplates(count: number): Template[] {
  const templates: Template[] = []

  for (let i = 0; i < count; i++) {
    const nameIndex = i % TEMPLATE_NAMES.length
    const descIndex = i % TEMPLATE_DESCRIPTIONS.length
    const featureIndex = i % TEMPLATE_FEATURES.length
    const tagIndex = i % TEMPLATE_TAGS.length

    templates.push({
      slug: `template-${i + 1}`,
      name: `${TEMPLATE_NAMES[nameIndex]} ${i > 19 ? `(${Math.floor(i / 20)})` : ""}`,
      emoji: "bot",
      description: TEMPLATE_DESCRIPTIONS[descIndex],
      category: TEMPLATE_CATEGORIES[i % TEMPLATE_CATEGORIES.length],
      creditCost: Math.floor(Math.random() * 10) + 1,
      features: TEMPLATE_FEATURES[featureIndex],
      tags: TEMPLATE_TAGS[tagIndex],
      configFields: [],
      isPopular: Math.random() > 0.7, // 30% are popular
    })
  }

  return templates
}

/* ------------------------------------------------------------------ */
/*  Project Mock Data                                                  */
/* ------------------------------------------------------------------ */

const PROJECT_NAMES = [
  "Customer Portal",
  "Admin Dashboard",
  "Mobile App Backend",
  "Payment Processor",
  "Analytics Engine",
  "Content Manager",
  "User Service",
  "Notification Hub",
  "Data Warehouse",
  "API Gateway",
  "Auth Service",
  "File Storage",
  "Search Service",
  "Chat Platform",
  "Video Processor",
  "Email Service",
  "SMS Gateway",
  "Cache Layer",
  "Queue Manager",
  "Monitoring System",
]

const PROJECT_DESCRIPTIONS = [
  "Main customer-facing application",
  "Internal administration tools",
  "RESTful API for mobile clients",
  "Payment processing and billing",
  "Real-time analytics and reporting",
  "Content management system",
  "User authentication and profiles",
  "Push notifications and alerts",
  "Data aggregation and storage",
  "API routing and load balancing",
]

const PROJECT_STATUSES = ["draft", "deployed", "failed"] as const

export function generateMockProjects(count: number): Project[] {
  const projects: Project[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const nameIndex = i % PROJECT_NAMES.length
    const descIndex = i % PROJECT_DESCRIPTIONS.length
    const status = PROJECT_STATUSES[i % PROJECT_STATUSES.length]
    const createdAt = new Date(
      now - Math.random() * 90 * 24 * 60 * 60 * 1000
    ).toISOString() // Random date within last 90 days

    projects.push({
      id: `project-${i + 1}`,
      name: `${PROJECT_NAMES[nameIndex]} ${i > 19 ? `v${Math.floor(i / 20)}` : ""}`,
      emoji: "rocket",
      description: PROJECT_DESCRIPTIONS[descIndex],
      status,
      category: "telegram_bot",
      createdAt,
      updatedAt: new Date(
        new Date(createdAt).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      config: {
        apiKey: "test-key",
        webhookUrl: "https://example.com/webhook",
      },
      deployment:
        status === "deployed"
          ? {
              url: `https://project-${i + 1}.example.com`,
              botUsername: `project_${i + 1}_bot`,
              status: "running",
              runningSince: createdAt,
              costEstimate: `$${(Math.random() * 50).toFixed(2)}/mo`,
            }
          : null,
      files: [],
      envVars: [],
      logs: [],
    })
  }

  return projects
}

/* ------------------------------------------------------------------ */
/*  Utility Functions                                                  */
/* ------------------------------------------------------------------ */

export function seedTemplatesStore(count: number): Template[] {
  const templates = generateMockTemplates(count)

  // Store in sessionStorage for persistence during testing
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('mock-templates', JSON.stringify(templates))
  }

  return templates
}

export function seedProjectsStore(count: number): Project[] {
  const projects = generateMockProjects(count)

  // Store in sessionStorage for persistence during testing
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('mock-projects', JSON.stringify(projects))
  }

  return projects
}

export function clearMockData() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('mock-templates')
    sessionStorage.removeItem('mock-projects')
  }
}

export function getMockTemplates(): Template[] | null {
  if (typeof window === 'undefined') return null

  const stored = sessionStorage.getItem('mock-templates')
  return stored ? JSON.parse(stored) : null
}

export function getMockProjects(): Project[] | null {
  if (typeof window === 'undefined') return null

  const stored = sessionStorage.getItem('mock-projects')
  return stored ? JSON.parse(stored) : null
}

import type { UserProfileResponse, RecentProjectsResponse } from "@/types"

export async function getUserProfile(): Promise<UserProfileResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  return {
    success: true,
    user: {
      id: "usr_1",
      name: "Алексей",
      email: "alex@example.com",
      plan: "pro",
      credits: 150,
      projectsCount: 3,
      projectsLimit: 10,
      deployedCount: 2,
    },
  }
}

export async function getRecentProjects(): Promise<RecentProjectsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  return {
    success: true,
    projects: [
      {
        id: "proj_1",
        name: "Магазин цветов",
        emoji: "🌸",
        status: "deployed",
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "proj_2",
        name: "Поддержка клиентов",
        emoji: "💬",
        status: "generated",
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "proj_3",
        name: "Тестовый бот",
        emoji: "🤖",
        status: "draft",
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  }
}

import type { MetadataRoute } from "next"
import { readdir, readFile } from "fs/promises"
import { join } from "path"
import matter from "gray-matter"
import { env } from "@/shared/config/env"

const SITE_URL = env.NEXT_PUBLIC_SITE_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/templates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  // Dynamic blog posts
  const blogPosts = await getBlogPostsForSitemap()

  return [...staticPages, ...blogPosts]
}

/**
 * Get all blog posts for sitemap generation
 */
async function getBlogPostsForSitemap(): Promise<MetadataRoute.Sitemap> {
  const contentPath = join(process.cwd(), "content", "blog")

  try {
    const files = await readdir(contentPath)
    const mdxFiles = files.filter((file) => file.endsWith(".mdx"))

    const posts = await Promise.all(
      mdxFiles.map(async (file) => {
        const slug = file.replace(".mdx", "")
        const source = await readFile(join(contentPath, file), "utf8")
        const { data } = matter(source)

        return {
          url: `${SITE_URL}/blog/${slug}`,
          lastModified: new Date(data.date as string),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }
      })
    )

    return posts
  } catch (error) {
    console.error("Error generating sitemap for blog posts:", error)
    return []
  }
}

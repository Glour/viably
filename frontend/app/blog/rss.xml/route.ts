import { readdir, readFile } from "fs/promises"
import { join } from "path"
import matter from "gray-matter"
import type { BlogPostFrontmatter } from "../page"

/**
 * RSS feed generation for blog posts
 * Accessible at /blog/rss.xml
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://viably.dev"
  const contentPath = join(process.cwd(), "content", "blog")

  try {
    // Read all blog posts
    const files = await readdir(contentPath)
    const mdxFiles = files.filter((file) => file.endsWith(".mdx"))

    const posts = await Promise.all(
      mdxFiles.map(async (file) => {
        const slug = file.replace(".mdx", "")
        const source = await readFile(join(contentPath, file), "utf8")
        const { data, content } = matter(source)

        return {
          slug,
          frontmatter: data as BlogPostFrontmatter,
          content,
        }
      })
    )

    // Sort by date (newest first)
    const sortedPosts = posts.sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    )

    // Generate RSS XML
    const rss = generateRSS(siteUrl, sortedPosts)

    return new Response(rss, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("Error generating RSS feed:", error)
    return new Response("Error generating RSS feed", { status: 500 })
  }
}

/**
 * Generate RSS XML from blog posts
 */
function generateRSS(
  siteUrl: string,
  posts: Array<{
    slug: string
    frontmatter: BlogPostFrontmatter
    content: string
  }>
): string {
  const latestPostDate =
    posts.length > 0
      ? new Date(posts[0].frontmatter.date).toUTCString()
      : new Date().toUTCString()

  const rssItems = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${escapeXml(post.frontmatter.title)}]]></title>
      <description><![CDATA[${escapeXml(post.frontmatter.description)}]]></description>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.frontmatter.date).toUTCString()}</pubDate>
      <author>${escapeXml(post.frontmatter.author)}</author>
      <category>${escapeXml(post.frontmatter.category)}</category>
      ${post.frontmatter.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("\n      ")}
      ${post.frontmatter.image ? `<enclosure url="${siteUrl}${post.frontmatter.image}" type="image/jpeg" />` : ""}
    </item>`
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Viably Blog</title>
    <description>Latest articles, tutorials, and insights about building AI-powered bots with Viably</description>
    <link>${siteUrl}/blog</link>
    <language>en-us</language>
    <lastBuildDate>${latestPostDate}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/og-image.png</url>
      <title>Viably Blog</title>
      <link>${siteUrl}/blog</link>
    </image>
    ${rssItems}
  </channel>
</rss>`
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

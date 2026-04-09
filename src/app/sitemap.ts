import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://crowdunlock-mvp.vercel.app";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/browse`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/forum`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/leaderboards`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/forum/perks`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/guidelines`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/dmca`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Dynamic: published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(500);

  const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updated_at ?? p.published_at ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic: forum threads
  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const forumRoutes: MetadataRoute.Sitemap = (threads ?? []).map((t) => ({
    url: `${siteUrl}/forum/${t.id}`,
    lastModified: t.created_at ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: forum sections
  const sectionIds = [
    "general",
    "introduce_yourself",
    "request_story",
    "request_data",
    "request_video",
    "listed_stories",
    "listed_data",
    "listed_videos",
  ];
  const sectionRoutes: MetadataRoute.Sitemap = sectionIds.map((id) => ({
    url: `${siteUrl}/forum/s/${id}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...sectionRoutes, ...blogRoutes, ...forumRoutes];
}

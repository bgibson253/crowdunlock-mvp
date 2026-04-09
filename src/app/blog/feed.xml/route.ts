import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug,title,meta_description,published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crowdunlock-mvp.vercel.app";

  const items = (posts ?? [])
    .map((p) => {
      const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : "";
      return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${p.slug}</guid>
      <description><![CDATA[${p.meta_description ?? p.title}]]></description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Unmaskr Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Insights, updates, and stories from the Unmaskr team.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=600",
    },
  });
}

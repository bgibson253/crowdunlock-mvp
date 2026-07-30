import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CACHE_TTL_MS = 7 * 24 * 3600 * 1000; // 7 days
const MAX_HTML_BYTES = 500_000;

function isSafeUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  // Block obvious SSRF targets: localhost, IP literals in private ranges.
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return null;
    }
  }
  if (host.includes(":")) return null; // IPv6 literals — skip entirely
  return url;
}

function extractMeta(html: string, baseUrl: URL) {
  const pick = (...patterns: RegExp[]): string | null => {
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeEntities(m[1].trim());
    }
    return null;
  };

  // property/name before content AND content before property/name orderings
  const meta = (key: string) => [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"),
  ];

  const title =
    pick(...meta("og:title"), ...meta("twitter:title")) ??
    pick(/<title[^>]*>([^<]+)<\/title>/i);
  const description = pick(...meta("og:description"), ...meta("twitter:description"), ...meta("description"));
  let image = pick(...meta("og:image"), ...meta("twitter:image"));
  const siteName = pick(...meta("og:site_name")) ?? baseUrl.hostname.replace(/^www\./, "");

  // Resolve relative image URLs
  if (image && !/^https?:\/\//i.test(image)) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      image = null;
    }
  }
  // Only allow https images (avoid mixed content)
  if (image && !image.startsWith("https://")) image = null;

  return { title, description, image, siteName };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ");
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") ?? "";
  const url = isSafeUrl(raw);
  if (!url) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`linkpreview:${ip}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase =
    serviceKey && supabaseUrl ? createClient(supabaseUrl, serviceKey) : null;

  const canonical = url.toString();

  // Cache hit?
  if (supabase) {
    const { data: cached } = await supabase
      .from("link_previews")
      .select("title,description,image_url,site_name,fetched_at,ok")
      .eq("url", canonical)
      .maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
      if (!cached.ok) return NextResponse.json({ error: "unavailable" }, { status: 404 });
      return NextResponse.json(
        {
          title: cached.title,
          description: cached.description,
          image: cached.image_url,
          siteName: cached.site_name,
          url: canonical,
        },
        { headers: { "cache-control": "public, max-age=3600" } },
      );
    }
  }

  // Fetch the page
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(canonical, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; UnmaskrBot/1.0; +https://unmaskr.org)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);

    const ctype = res.headers.get("content-type") ?? "";
    if (!res.ok || !ctype.includes("text/html")) throw new Error("not_html");

    // Read at most MAX_HTML_BYTES
    const reader = res.body?.getReader();
    let html = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (bytes > MAX_HTML_BYTES) {
        controller.abort();
        break;
      }
    }

    const { title, description, image, siteName } = extractMeta(html, url);
    if (!title) throw new Error("no_meta");

    if (supabase) {
      await supabase.from("link_previews").upsert({
        url: canonical,
        title: title.slice(0, 300),
        description: description?.slice(0, 500) ?? null,
        image_url: image,
        site_name: siteName?.slice(0, 100) ?? null,
        fetched_at: new Date().toISOString(),
        ok: true,
      });
    }

    return NextResponse.json(
      { title, description, image, siteName, url: canonical },
      { headers: { "cache-control": "public, max-age=3600" } },
    );
  } catch {
    // Negative-cache failures so we don't hammer dead links
    if (supabase) {
      await supabase.from("link_previews").upsert({
        url: canonical,
        ok: false,
        fetched_at: new Date().toISOString(),
      });
    }
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_DOMAINS: Record<string, string> = {
  twitter: "x.com",
  instagram: "www.instagram.com",
  tiktok: "www.tiktok.com",
  reddit: "www.reddit.com",
};

const PROFILE_PATHS: Record<string, (u: string) => string> = {
  twitter: (u) => `/${u}`,
  instagram: (u) => `/${u}/`,
  tiktok: (u) => `/@${u}`,
  reddit: (u) => `/user/${u}/`,
};

// Only allow alphanumeric + underscores + dots (standard social usernames)
const USERNAME_RE = /^[a-zA-Z0-9_.]{1,50}$/;

export async function POST(req: NextRequest) {
  // 1. Auth check — only logged-in users can verify
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit — 5 verify attempts per minute per user
  const rl = rateLimit(`social-verify:${user.id}`, { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const platform = body?.platform;
  const username = body?.username;
  const code = body?.code;

  if (!platform || !username || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 3. Validate platform is one of our known set
  const domain = ALLOWED_DOMAINS[platform];
  const pathFn = PROFILE_PATHS[platform];
  if (!domain || !pathFn) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  // 4. Validate username format — prevent path traversal / injection
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
  }

  // 5. Validate code format — must match our generated format (unmaskr-XXXXXXXX)
  if (!/^unmaskr-[a-z0-9]{6,12}$/.test(code)) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  // 6. Construct URL from validated parts — prevents SSRF
  const profileUrl = `https://${domain}${pathFn(username)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s max

    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UnmaskrBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { verified: false, error: `Could not reach ${platform} profile (HTTP ${res.status}). Check username.` },
        { status: 200 }
      );
    }

    // Limit response body size to prevent memory abuse (5MB max)
    const text = await res.text();
    const html = text.slice(0, 5_000_000);
    const found = html.includes(code);

    return NextResponse.json({ verified: found });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ verified: false, error: "Profile check timed out." }, { status: 200 });
    }
    return NextResponse.json(
      { verified: false, error: "Failed to check profile." },
      { status: 200 }
    );
  }
}

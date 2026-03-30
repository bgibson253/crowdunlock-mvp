import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit — 3 username changes per hour
  const rl = rateLimit(`set-username:${user.id}`, { maxRequests: 3, windowMs: 3600_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => null)) as null | { username?: string };
  const raw = String(body?.username ?? "").trim();

  // Strict validation: lowercase alphanumeric + underscores + hyphens only
  const username = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  if (!username || username.length < 3 || username.length > 24) {
    return NextResponse.json({ error: "Username must be 3-24 characters (letters, numbers, underscores, hyphens)" }, { status: 400 });
  }

  // Block reserved words
  const RESERVED = ["admin", "moderator", "mod", "unmaskr", "system", "support", "help", "deleted", "anonymous", "null", "undefined"];
  if (RESERVED.includes(username)) {
    return NextResponse.json({ error: "That username is reserved." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

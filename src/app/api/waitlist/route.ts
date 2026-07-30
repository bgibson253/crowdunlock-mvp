import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — 5 signups per 10 minutes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`waitlist:${ip}`, { maxRequests: 5, windowMs: 600_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("launch_waitlist")
      .insert({ email, source: "unmaskr.org" })
      .select("id")
      .single();

    if (error) {
      const msg = String(error.message ?? "");
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("row-level security")) {
        return NextResponse.json({ error: "already_joined" }, { status: 409 });
      }
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

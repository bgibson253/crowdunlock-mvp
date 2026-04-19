import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const platform = typeof body?.platform === "string" ? body.platform : "web";
  const status = body?.status === "away" ? "away" : "online";

  const now = new Date().toISOString();

  const { error } = await supabase.from("user_presence").upsert({
    user_id: user.id,
    platform,
    status,
    last_seen_at: now,
    last_heartbeat_at: now,
    updated_at: now,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

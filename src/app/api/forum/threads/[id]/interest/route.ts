import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/forum/threads/[id]/interest
 * Body: { amount?: number }  (optional dollars — "I'd chip in about $X")
 * Toggles the caller's interest pledge on a request thread.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid_thread" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const rl = rateLimit(`interest:${user.id}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const amountDollars = Number(body?.amount ?? 0);
  const amountCents =
    Number.isFinite(amountDollars) && amountDollars > 0
      ? Math.min(Math.round(amountDollars * 100), 1_000_000)
      : null;

  // Verify the thread exists and isn't deleted/locked
  const { data: thread } = await supabase
    .from("forum_threads")
    .select("id,deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (!thread || thread.deleted_at) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Toggle: if a pledge exists, remove it; otherwise insert.
  const { data: existing } = await supabase
    .from("thread_interest")
    .select("thread_id")
    .eq("thread_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("thread_interest")
      .delete()
      .eq("thread_id", id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("thread_interest")
      .insert({ thread_id: id, user_id: user.id, amount_cents: amountCents });
    if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  const { data: stats } = await supabase.rpc("thread_interest_stats", { p_thread_id: id });
  const row = Array.isArray(stats) ? stats[0] : stats;

  return NextResponse.json({
    ok: true,
    interested: !existing,
    backers: Number(row?.backers ?? 0),
    pledged_cents: Number(row?.pledged_cents ?? 0),
  });
}

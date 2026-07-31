import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/forum/threads/[id]/share
 * Counts a share action and returns the sharer's referral code (if logged in)
 * so the client can build an attributed share link.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid_thread" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`share:${ip}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const supabase = await supabaseServer();

  // Count the share (works logged-out too)
  await supabase.rpc("increment_thread_share", { p_thread_id: id });

  // Referral code for attributed links (logged-in sharers only)
  let refCode: string | null = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .maybeSingle();
    refCode = profile?.referral_code ?? null;
  }

  return NextResponse.json({ ok: true, ref: refCode });
}

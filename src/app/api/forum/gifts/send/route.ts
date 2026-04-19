import { NextResponse } from "next/server";
import { envClient } from "@/lib/env";
import { requireUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));

  const postType: "thread" | "reply" | undefined = body?.postType;
  const postId: string | undefined = body?.postId;
  const receiverUserId: string | undefined = body?.receiverUserId;
  const giftId: string | undefined = body?.giftId;

  if (!postType || !postId || !receiverUserId || !giftId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (receiverUserId === user.id) {
    return NextResponse.json({ error: "Cannot gift yourself" }, { status: 400 });
  }

  const env = envClient();
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

  // Get gift cost
  const { data: gift, error: giftErr } = await supabase
    .from("gift_catalog")
    .select("id,coin_cost,is_active")
    .eq("id", giftId)
    .maybeSingle();

  if (giftErr || !gift || !gift.is_active) {
    return NextResponse.json({ error: "Invalid gift" }, { status: 400 });
  }

  const coinCost = Number(gift.coin_cost);

  const { data: senderProfile, error: senderErr } = await supabase
    .from("profiles")
    .select("coins_balance")
    .eq("id", user.id)
    .maybeSingle();

  if (senderErr || !senderProfile) {
    return NextResponse.json({ error: "Sender profile missing" }, { status: 400 });
  }

  const senderCoins = Number(senderProfile.coins_balance ?? 0);
  if (senderCoins < coinCost) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
  }

  // For v1: fixed exchange rate for reporting value + earnings
  // (Real money came in when coins purchased; gifts move value to creator with platform cut.)
  const usdValueCents = coinCost; // 1 coin = 1 cent (simple baseline)
  const platformFeeBps = 500; // 5%
  const platformFeeCents = Math.round((usdValueCents * platformFeeBps) / 10_000);
  const netCents = usdValueCents - platformFeeCents;

  // Deduct coins (idempotency by request id optional later)
  const { error: deductErr } = await supabase.rpc("apply_coins", {
    p_user_id: user.id,
    p_delta: -coinCost,
    p_reason: "send_forum_gift",
    p_ref_type: "forum_gift",
    p_ref_id: `${postType}:${postId}:${giftId}:${Date.now()}`,
  });
  if (deductErr) {
    return NextResponse.json({ error: deductErr.message }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from("forum_gifts").insert({
    post_type: postType,
    post_id: postId,
    sender_user_id: user.id,
    receiver_user_id: receiverUserId,
    gift_id: giftId,
    coin_cost: coinCost,
    usd_value_cents: usdValueCents,
    platform_fee_cents: platformFeeCents,
    net_earnings_cents: netCents,
  });
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  const { error: earnErr } = await supabase.rpc("apply_earnings", {
    p_user_id: receiverUserId,
    p_delta_cents: netCents,
    p_reason: "forum_gift_received",
    p_ref_type: "forum_gift",
    p_ref_id: `${postType}:${postId}:${giftId}:${user.id}`,
  });
  if (earnErr && !/duplicate key/i.test(earnErr.message)) {
    return NextResponse.json({ error: earnErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

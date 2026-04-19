import { NextResponse } from "next/server";
import { stripeServer } from "@/lib/stripe/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = stripeServer();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Set STRIPE_SECRET_KEY." },
      { status: 501 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const hostUserId = typeof body?.host_user_id === "string" ? body.host_user_id : null;
  const hostUsername = typeof body?.host_username === "string" ? body.host_username : null;
  const liveRoomId = typeof body?.live_room_id === "string" ? body.live_room_id : null;
  const amountDollars = Number(body?.amount ?? 0);

  if (!hostUserId || !hostUsername || !liveRoomId || !Number.isFinite(amountDollars) || amountDollars <= 0) {
    return NextResponse.json({ error: "Invalid host_user_id/host_username/live_room_id/amount" }, { status: 400 });
  }

  // Verify room is live for host
  const { data: room } = await supabase
    .from("live_rooms")
    .select("id,status,host_user_id,title")
    .eq("id", liveRoomId)
    .maybeSingle();

  if (!room || room.host_user_id !== hostUserId || room.status !== "live") {
    return NextResponse.json({ error: "Live room not found or not live" }, { status: 404 });
  }

  const amountCents = clampInt(Math.round(amountDollars * 100), 100, 50_000); // $1..$500
  const feeBps = 500;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Live tip`.slice(0, 250),
            description: room.title ? `Tip for: ${room.title}`.slice(0, 500) : undefined,
          },
        },
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/live/${encodeURIComponent(hostUsername)}?tipped=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/live/${encodeURIComponent(hostUsername)}?canceled=1`,
    metadata: {
      kind: "live_tip",
      host_user_id: hostUserId,
      live_room_id: liveRoomId,
      tipper_user_id: user.id,
      amount_cents: String(amountCents),
      fee_bps: String(feeBps),
    },
  });

  return NextResponse.json({ url: session.url });
}

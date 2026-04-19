import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeServer } from "@/lib/stripe/server";
import { envClient } from "@/lib/env";

export const runtime = "nodejs";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  const stripe = stripeServer();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const secret = requiredEnv("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err?.message ?? "unknown"}` },
      { status: 400 },
    );
  }

  const env = envClient();
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const kind = session.metadata?.kind;

        // =====================================
        // Live tips
        // =====================================
        if (kind === "live_tip") {
          const hostUserId = session.metadata?.host_user_id;
          const liveRoomId = session.metadata?.live_room_id;
          const tipperUserId = session.metadata?.tipper_user_id;
          const amountCentsRaw = session.metadata?.amount_cents;
          const feeBpsRaw = session.metadata?.fee_bps ?? "500";

          if (!hostUserId || !liveRoomId || !tipperUserId || !amountCentsRaw) {
            throw new Error("Missing metadata on live_tip checkout session");
          }

          const amount = Number(amountCentsRaw);
          const feeBps = Number(feeBpsRaw);
          const platformFeeAmount = Math.round((amount * feeBps) / 10_000);
          const pointsMinted = platformFeeAmount * 100;

          const currency = (session.currency ?? "usd").toLowerCase();
          const paymentIntentId =
            typeof session.payment_intent === "string" ? session.payment_intent : null;

          const { error: tipErr } = await supabase.from("live_tips").insert({
            live_room_id: liveRoomId,
            host_user_id: hostUserId,
            tipper_user_id: tipperUserId,
            amount_cents: amount,
            currency,
            platform_fee_amount: platformFeeAmount,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
          });

          if (tipErr && !/duplicate key/i.test(tipErr.message)) {
            throw new Error(tipErr.message);
          }

          if (pointsMinted > 0) {
            const { error: ptsErr } = await supabase.rpc("apply_points", {
              p_user_id: tipperUserId,
              p_delta: pointsMinted,
              p_reason: "mint_platform_fee",
              p_ref_type: "stripe_checkout_session",
              p_ref_id: session.id,
            });
            if (ptsErr && !/duplicate key/i.test(ptsErr.message)) {
              throw new Error(ptsErr.message);
            }
          }

          // Best-effort: broadcast the tip event into the room via LiveKit data message
          try {
            const { livekitServerClient } = await import("@/lib/livekit/server");
            const lk = await livekitServerClient();
            const payload = JSON.stringify({
              t: "tip",
              hostUserId,
              tipperUserId,
              amountCents: amount,
              currency,
            });
            // Send to everyone (broadcast) — using server API.
            const { DataPacket_Kind } = await import("livekit-server-sdk");
            await (lk as any).sendData(liveRoomId, new TextEncoder().encode(payload), {
              kind: DataPacket_Kind.RELIABLE,
            });
          } catch {
            // ignore
          }

          break;
        }

        // =====================================
        // Coin packs (money -> coins)
        // =====================================
        if (kind === "coin_pack") {
          const userId = session.metadata?.user_id;
          const packId = session.metadata?.pack_id;
          const coinsRaw = session.metadata?.coins;

          if (!userId || !packId || !coinsRaw) {
            throw new Error("Missing metadata on coin_pack checkout session");
          }

          const coins = Number(coinsRaw);
          if (!Number.isFinite(coins) || coins <= 0) throw new Error("Invalid coins amount");

          const { error: coinErr } = await supabase.rpc("apply_coins", {
            p_user_id: userId,
            p_delta: coins,
            p_reason: "coin_pack_purchase",
            p_ref_type: "stripe_checkout_session",
            p_ref_id: session.id,
          });

          if (coinErr && !/duplicate key/i.test(coinErr.message)) {
            throw new Error(coinErr.message);
          }

          break;
        }

        // =====================================
        // Contributions
        // =====================================
        // Our checkout sessions will include metadata: kind=contribution, upload_id, user_id, tip_cents, fee_bps
        if (kind !== "contribution") break;

        const uploadId = session.metadata?.upload_id;
        const userId = session.metadata?.user_id;
        const amountCentsRaw = session.metadata?.amount_cents;
        const tipCentsRaw = session.metadata?.tip_cents ?? "0";
        const feeBpsRaw = session.metadata?.fee_bps ?? "500";

        if (!uploadId || !userId || !amountCentsRaw) {
          throw new Error("Missing metadata on checkout session");
        }

        const amount = Number(amountCentsRaw);
        const tipAmount = Number(tipCentsRaw);
        const feeBps = Number(feeBpsRaw);
        const platformFeeAmount = Math.round((amount * feeBps) / 10_000);
        const pointsMinted = platformFeeAmount * 100; // 100 points per $1 of platform fee

        const currency = (session.currency ?? "usd").toLowerCase();
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;

        // Idempotent insert keyed by checkout_session_id
        const { error: insertErr } = await supabase.from("contributions").insert({
          upload_id: uploadId,
          user_id: userId,
          amount,
          currency,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          tip_amount: tipAmount,
          platform_fee_amount: platformFeeAmount,
        });

        // If conflict, ignore (already inserted)
        if (insertErr && !/duplicate key/i.test(insertErr.message)) {
          throw new Error(insertErr.message);
        }

        // Update upload current_funded + unlock check (tip does not count toward funding)
        const { data: upload, error: uploadErr } = await supabase
          .from("uploads")
          .select("id,current_funded,funding_goal,status")
          .eq("id", uploadId)
          .maybeSingle();

        if (uploadErr || !upload) throw new Error("Upload not found for webhook");

        const newFunded = (upload.current_funded ?? 0) + amount;
        const updates: Record<string, any> = { current_funded: newFunded };
        if (upload.funding_goal && newFunded >= upload.funding_goal) {
          updates.status = "unlocked";
        }

        const { error: updErr } = await supabase.from("uploads").update(updates).eq("id", uploadId);
        if (updErr) throw new Error(updErr.message);

        // Mint non-cash points for the payer based on platform fee.
        // Idempotency: ledger ref uses checkout session id.
        if (pointsMinted > 0) {
          const { error: ptsErr } = await supabase.rpc("apply_points", {
            p_user_id: userId,
            p_delta: pointsMinted,
            p_reason: "mint_platform_fee",
            p_ref_type: "stripe_checkout_session",
            p_ref_id: session.id,
          });

          // Apply_points currently only grants service_role; webhook uses service_role so this should work.
          // If duplicate inserts become an issue, we'll add a unique constraint on (user_id, ref_type, ref_id).
          if (ptsErr && !/duplicate key/i.test(ptsErr.message)) {
            throw new Error(ptsErr.message);
          }
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (!paymentIntentId) break;

        // mark contribution refunded (best-effort)
        await supabase
          .from("contributions")
          .update({ refunded_at: new Date().toISOString(), refund_stripe_id: charge.refunds?.data?.[0]?.id ?? null })
          .eq("stripe_payment_intent_id", paymentIntentId);

        break;
      }

      default:
        // ignore
        break;
    }

    return new NextResponse("ok", { status: 200 });
  } catch (e: any) {
    // Return 200 for unexpected cases? No: Stripe will retry; better to surface errors during setup.
    return NextResponse.json(
      { error: e?.message ?? "webhook_error", event: event.type },
      { status: 500 },
    );
  }
}

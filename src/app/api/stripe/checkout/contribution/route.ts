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
  const uploadId = String(body?.upload_id ?? "");
  const amountDollars = Number(body?.amount ?? 0);
  const tipDollars = Number(body?.tip ?? 0);

  if (!uploadId || !Number.isFinite(amountDollars) || amountDollars <= 0) {
    return NextResponse.json({ error: "Invalid upload_id or amount" }, { status: 400 });
  }

  // min $1, max $10,000 per contribution (can tune later)
  const amountCents = clampInt(Math.round(amountDollars * 100), 100, 1_000_000);
  const tipCents = clampInt(Math.round(Math.max(0, tipDollars) * 100), 0, 1_000_000);

  // Fetch upload settings (fee, policy)
  const { data: upload, error: uploadErr } = await supabase
    .from("uploads")
    .select("id,title,status,fee_bps,allow_tips,deadline_at,is_refundable")
    .eq("id", uploadId)
    .maybeSingle();

  if (uploadErr || !upload) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (upload.status !== "funding") {
    return NextResponse.json({ error: "Not accepting contributions" }, { status: 409 });
  }

  const feeBps = upload.fee_bps ?? 500;
  const allowTips = upload.allow_tips ?? true;
  const isRefundable = upload.is_refundable ?? true;

  const finalTipCents = allowTips ? tipCents : 0;

  const lineItems: any[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: amountCents,
        product_data: {
          name: `Contribution to: ${upload.title}`.slice(0, 250),
          description: isRefundable
            ? "Refunds apply if the goal has a deadline and is not unlocked by that deadline."
            : "No refunds for no-timeline goals.",
        },
      },
    },
  ];

  if (finalTipCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: finalTipCents,
        product_data: {
          name: "Tip to Unmaskr (optional)",
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/browse?contributed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/browse?canceled=1`,
    metadata: {
      kind: "contribution",
      upload_id: uploadId,
      user_id: user.id,
      amount_cents: String(amountCents),
      tip_cents: String(finalTipCents),
      fee_bps: String(feeBps),
    },
  });

  return NextResponse.json({ url: session.url });
}

import { NextResponse } from "next/server";
import { stripeServer } from "@/lib/stripe/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const title = String(form.get("title") ?? "");
  const why = String(form.get("why_it_matters") ?? "");
  const tagsRaw = String(form.get("tags") ?? "");

  if (!title || !why || why.length < 100) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const stripe = stripeServer();

  // Store draft payload in Stripe metadata (kept small).
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 200,
          product_data: {
            name: "CrowdUnlock posting fee - refundable",
          },
        },
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload?canceled=1`,
    metadata: {
      kind: "posting_fee",
      uploader_id: user.id,
      title: title.slice(0, 250),
      why_it_matters: why.slice(0, 1000),
      tags: JSON.stringify(tags).slice(0, 1000),
      // NOTE: file must be re-uploaded after redirect; we'll handle later with signed upload URLs.
    },
  });

  return NextResponse.json({ url: session.url });
}

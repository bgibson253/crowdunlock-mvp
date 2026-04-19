import { NextResponse } from "next/server";
import { stripeServer } from "@/lib/stripe/server";
import { getCoinPack } from "@/lib/coins/packs";
import { requireUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = stripeServer();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });

  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const packId: string | undefined = body?.packId;

  if (!packId) return NextResponse.json({ error: "Missing packId" }, { status: 400 });
  const pack = getCoinPack(packId);
  if (!pack) return NextResponse.json({ error: "Invalid packId" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL" }, { status: 500 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.usdCents,
          product_data: { name: `Coins: ${pack.name}` },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/wallet?success=1`,
    cancel_url: `${appUrl}/wallet?canceled=1`,
    metadata: {
      kind: "coin_pack",
      user_id: user.id,
      pack_id: pack.id,
      coins: String(pack.coins),
      usd_cents: String(pack.usdCents),
    },
  });

  return NextResponse.json({ url: session.url });
}

import { NextResponse } from "next/server";
import { stripeServer } from "@/lib/stripe/server";
import { requireUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Buy coins if needed to send a gift (simple path). Later: allow paying with existing coins.
export async function POST(req: Request) {
  const stripe = stripeServer();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });

  const user = await requireUser();
  const body = await req.json().catch(() => ({}));

  const postType: "thread" | "reply" | undefined = body?.postType;
  const postId: string | undefined = body?.postId;
  const giftId: string | undefined = body?.giftId;
  const receiverUserId: string | undefined = body?.receiverUserId;

  if (!postType || !postId || !giftId || !receiverUserId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");

  // For v1, we don't price gifts in USD directly here; we sell coins packs.
  // Client should ensure user has enough coins; if not, send them to coin pack checkout.
  // Keeping this endpoint for a future direct purchase flow.
  return NextResponse.json(
    {
      error: "Direct gift checkout not implemented. Buy coins first and then send gift with coins.",
      buyCoinsUrl: `${appUrl}/wallet`,
    },
    { status: 400 },
  );
}

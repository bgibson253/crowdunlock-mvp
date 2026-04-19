import { NextResponse } from "next/server";
import { stripeServer } from "@/lib/stripe/server";
import { requireUser } from "@/lib/auth/require-user";
import { envClient } from "@/lib/env";

export const runtime = "nodejs";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST() {
  const stripe = stripeServer();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });

  const user = await requireUser();
  const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");

  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const env = envClient();
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

  // Find or create connected account
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id,stripe_connect_account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  let acctId = profile.stripe_connect_account_id as string | null;
  if (!acctId) {
    const acct = await stripe.accounts.create({
      type: "express",
      capabilities: {
        transfers: { requested: true },
      },
      metadata: { user_id: user.id },
    });

    acctId = acct.id;
    await supabase
      .from("profiles")
      .update({ stripe_connect_account_id: acctId })
      .eq("id", user.id);
  }

  const accountLink = await stripe.accountLinks.create({
    account: acctId,
    refresh_url: `${appUrl}/earnings?refresh=1`,
    return_url: `${appUrl}/earnings?return=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

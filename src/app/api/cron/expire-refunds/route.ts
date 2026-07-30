import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripeServer } from "@/lib/stripe/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * GET/POST /api/cron/expire-refunds
 *
 * Cron-driven refund automation. Finds uploads that:
 *   - are still in 'funding' status
 *   - have a deadline (deadline_at) in the past
 *   - did NOT reach their funding goal
 * ...and for each one:
 *   1. Refunds every non-refunded Stripe contribution (idempotent per payment intent)
 *   2. Marks the upload 'expired'
 *   3. Emails each contributor that their refund is on the way
 *
 * Auth: Authorization: Bearer <CRON_SECRET> or <SUPABASE_SERVICE_ROLE_KEY>
 * (same pattern as /api/notifications/digest). Vercel Cron sends CRON_SECRET
 * automatically when configured in vercel.json + env.
 */
export async function POST(req: NextRequest) {
  return handleExpireRefunds(req);
}

export async function GET(req: NextRequest) {
  return handleExpireRefunds(req);
}

function refundEmailHtml(uploadTitle: string, amountCents: number): string {
  const dollars = (amountCents / 100).toFixed(2);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0d2e; color: #e5e5f0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #a78bfa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 32px; }
    .card { background: #1a1744; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card h2 { margin: 0 0 12px; font-size: 18px; color: #f0f0ff; }
    .card p { margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #a0a0c0; }
    .footer { text-align: center; font-size: 12px; color: #606080; margin-top: 32px; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Unmaskr</div>
    <div class="card">
      <h2>Your $${dollars} refund is on the way</h2>
      <p>The funding deadline for <strong>"${uploadTitle}"</strong> passed before it reached its goal, so — as promised — your full contribution of $${dollars} has been refunded.</p>
      <p>Refunds typically appear on your statement within 5–10 business days, depending on your bank.</p>
      <p>Thanks for backing content you believe in. We hope you'll find the next one worth funding.</p>
    </div>
    <div class="footer">
      <p><a href="https://unmaskr.org">Unmaskr</a> — full refunds when deadlines aren't met. That's the deal.</p>
    </div>
  </div>
</body>
</html>`;
}

async function handleExpireRefunds(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    (!cronSecret || authHeader !== `Bearer ${cronSecret}`) &&
    (!serviceKey || authHeader !== `Bearer ${serviceKey}`)
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stripe = stripeServer();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }
  if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "missing_server_env" }, { status: 500 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

  // 1. Find expired, underfunded, refundable uploads
  const { data: expired, error: findErr } = await supabase
    .from("uploads")
    .select("id,title,current_funded,funding_goal,deadline_at,is_refundable")
    .eq("status", "funding")
    .eq("is_refundable", true)
    .not("deadline_at", "is", null)
    .lt("deadline_at", new Date().toISOString())
    .limit(25); // batch cap per run; cron will catch the rest next pass

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }

  const candidates = (expired ?? []).filter(
    (u) => (u.current_funded ?? 0) < (u.funding_goal ?? 0),
  );

  const results: {
    upload_id: string;
    refunded: number;
    failed: number;
    marked_expired: boolean;
  }[] = [];

  for (const upload of candidates) {
    let refunded = 0;
    let failed = 0;

    // 2. All non-refunded contributions with a payment intent
    const { data: contributions, error: contribErr } = await supabase
      .from("contributions")
      .select("id,user_id,amount,stripe_payment_intent_id,refunded_at")
      .eq("upload_id", upload.id)
      .is("refunded_at", null)
      .not("stripe_payment_intent_id", "is", null);

    if (contribErr) {
      results.push({ upload_id: upload.id, refunded: 0, failed: -1, marked_expired: false });
      continue;
    }

    for (const c of contributions ?? []) {
      try {
        // Idempotency key = contribution id, so retries can't double-refund
        await stripe.refunds.create(
          {
            payment_intent: c.stripe_payment_intent_id as string,
            reason: "requested_by_customer",
            metadata: {
              kind: "deadline_refund",
              upload_id: upload.id,
              contribution_id: c.id,
            },
          },
          { idempotencyKey: `deadline-refund-${c.id}` },
        );

        // Mark refunded immediately (webhook charge.refunded also updates, both idempotent)
        await supabase
          .from("contributions")
          .update({ refunded_at: new Date().toISOString() })
          .eq("id", c.id);

        refunded++;

        // 3. Notify the contributor (best-effort)
        if (c.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(c.user_id);
          if (authUser?.user?.email) {
            await sendEmail({
              to: authUser.user.email,
              subject: `Refund issued: "${upload.title}" didn't reach its goal`,
              html: refundEmailHtml(upload.title, c.amount ?? 0),
            });
          }
        }
      } catch (err: any) {
        // Already-refunded intents throw; treat as success for idempotency
        if (/has already been refunded/i.test(err?.message ?? "")) {
          await supabase
            .from("contributions")
            .update({ refunded_at: new Date().toISOString() })
            .eq("id", c.id);
          refunded++;
        } else {
          failed++;
        }
      }
    }

    // 4. Only mark expired once every refund attempt succeeded
    let markedExpired = false;
    if (failed === 0) {
      const { error: updErr } = await supabase
        .from("uploads")
        .update({ status: "expired" })
        .eq("id", upload.id)
        .eq("status", "funding"); // guard against concurrent unlock
      markedExpired = !updErr;
    }

    results.push({ upload_id: upload.id, refunded, failed, marked_expired: markedExpired });
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { envClient } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/contributions
 * Body: { upload_id: string, amount: number }
 *
 * Test-mode: inserts a contribution directly (no Stripe).
 * Production: would redirect to Stripe Checkout first.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth via cookie-based session (not spoofable Authorization header)
    const supabase = await supabaseServer();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit — 20 contributions per minute per user
    const rl = rateLimit(`contribution:${user.id}`, { maxRequests: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const { upload_id, amount } = await req.json();

    if (!upload_id || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "upload_id and a positive amount are required" },
        { status: 400 },
      );
    }

    // Validate upload_id is a valid UUID to prevent injection
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(upload_id)) {
      return NextResponse.json({ error: "Invalid upload_id" }, { status: 400 });
    }

    // Cap maximum single contribution to prevent abuse
    if (amount > 10000) {
      return NextResponse.json({ error: "Amount too large" }, { status: 400 });
    }

    const env = envClient();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Server misconfigured (missing service key)" },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

    // Verify upload exists and is in funding status
    const { data: upload, error: uploadErr } = await supabaseAdmin
      .from("uploads")
      .select("id,status,current_funded,funding_goal,funding_deadline,deadline_at,uploader_id")
      .eq("id", upload_id)
      .maybeSingle();

    if (uploadErr || !upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (upload.status !== "funding") {
      return NextResponse.json({ error: "Upload is not accepting contributions" }, { status: 400 });
    }

    // Check if funding deadline has passed
    if (upload.deadline_at && new Date(upload.deadline_at) < new Date()) {
      return NextResponse.json({ error: "Funding deadline has passed. Contributions are no longer accepted." }, { status: 400 });
    }

    // Insert contribution (amount stored in cents)
    const amountCents = Math.round(amount * 100);
    const { error: insertErr } = await supabaseAdmin.from("contributions").insert({
      upload_id,
      user_id: user.id,
      amount: amountCents,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Update current_funded on the upload (in cents)
    const newFunded = (upload.current_funded ?? 0) + amountCents;
    const updates: Record<string, any> = { current_funded: newFunded };

    // Determine unlock behavior — fully funded means instant unlock
    const justFullyFunded = upload.funding_goal && newFunded >= upload.funding_goal && (upload.current_funded ?? 0) < upload.funding_goal;
    if (justFullyFunded) {
      updates.status = "unlocked";
    }

    await supabaseAdmin.from("uploads").update(updates).eq("id", upload_id);

    // Check achievements for the contributor
    supabaseAdmin.rpc("check_achievements", { p_user_id: user.id }).then(() => {});

    // If upload just got funded (any mode), check achievements for uploader
    if (justFullyFunded) {
      if (upload.uploader_id) {
        supabaseAdmin.rpc("check_achievements", { p_user_id: upload.uploader_id }).then(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      current_funded: newFunded,
      status: updates.status ?? upload.status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

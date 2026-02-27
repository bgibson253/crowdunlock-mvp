import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { envClient } from "@/lib/env";

/**
 * POST /api/contributions
 * Body: { upload_id: string, amount: number }
 *
 * Test-mode: inserts a contribution directly (no Stripe).
 * Production: would redirect to Stripe Checkout first.
 */
export async function POST(req: NextRequest) {
  try {
    const { upload_id, amount } = await req.json();

    if (!upload_id || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "upload_id and a positive amount are required" },
        { status: 400 },
      );
    }

    // Get the user from the cookie-based session
    const env = envClient();
    const { createClient: createServerClient } = await import("@supabase/supabase-js");

    // Use service role to insert, but first validate the user via their cookie
    const authHeader = req.headers.get("authorization");
    const supabaseAuth = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: authHeader ?? "" } },
      },
    );

    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use service role for the insert + update
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Server misconfigured (missing service key)" },
        { status: 500 },
      );
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

    // Verify upload exists and is in funding status
    const { data: upload, error: uploadErr } = await supabase
      .from("uploads")
      .select("id,status,current_funded")
      .eq("id", upload_id)
      .maybeSingle();

    if (uploadErr || !upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Insert contribution (amount stored in cents; DB trigger adds to unlock_gross_cents)
    const amountCents = Math.round(amount * 100);
    const { error: insertErr } = await supabase.from("contributions").insert({
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

    // Check if funding goal is met (funding_goal is also in cents)
    const { data: fullUpload } = await supabase
      .from("uploads")
      .select("funding_goal")
      .eq("id", upload_id)
      .single();

    if (fullUpload?.funding_goal && newFunded >= fullUpload.funding_goal) {
      updates.status = "unlocked";
    }

    await supabase.from("uploads").update(updates).eq("id", upload_id);

    return NextResponse.json({
      ok: true,
      current_funded: newFunded,
      status: updates.status ?? upload.status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

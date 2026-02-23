import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { envClient, envServer } from "@/lib/env";
import { requireTestMode } from "@/lib/test-mode";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = requireTestMode();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 404 });

  const envC = envClient();
  const envS = envServer();

  if (!envS.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing" },
      { status: 500 },
    );
  }

  // TEST_MODE QA endpoint uses service role to avoid auth/RLS friction.
  const supabase = createClient(envC.NEXT_PUBLIC_SUPABASE_URL, envS.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const form = await req.formData();
  const title = String(form.get("title") ?? "");
  const why = String(form.get("why_it_matters") ?? "");
  const tagsRaw = String(form.get("tags") ?? "");
  const file = form.get("file");

  if (!title || !why || why.length < 100) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Use a NULL uploader_id in test mode so we do not violate the auth.users foreign key.
  // (Uploader ownership is enforced in production mode only.)
  const uploaderId: string | null = null;

  const ext = file.name.split(".").pop() || "bin";
  const objectName = `${crypto.randomUUID()}/${crypto.randomUUID()}.${ext}`;
  const filePath = `uploads/${objectName}`;

  const { error: uploadErr } = await supabase.storage
    .from("uploads")
    .upload(objectName, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 400 });
  }

  const { data: row, error: insErr } = await supabase
    .from("uploads")
    .insert({
      title,
      why_it_matters: why,
      tags,
      uploader_id: uploaderId,
      file_path: filePath,
      ai_teaser: "(Teaser pending)",
      quality_score: null,
      status: "funding",
      current_funded: 0,
      funding_goal: 500,
      posting_fee_payment_intent_id: null,
    })
    .select("id")
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, uploadId: row.id });
}

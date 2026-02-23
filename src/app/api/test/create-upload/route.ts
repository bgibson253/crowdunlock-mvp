import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireTestMode } from "@/lib/test-mode";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = requireTestMode();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 404 });

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Save file to Supabase Storage (private bucket; public read only when unlocked via RLS policy)
  const ext = file.name.split(".").pop() || "bin";
  const objectName = `${user.id}/${crypto.randomUUID()}.${ext}`;
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

  // TEST MODE behavior: immediately move into funding stage (payments disabled).
  // NOTE: AI teaser + quality pipeline is intentionally preserved; this is a placeholder only.
  const { data: row, error: insErr } = await supabase
    .from("uploads")
    .insert({
      title,
      why_it_matters: why,
      tags,
      uploader_id: user.id,
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

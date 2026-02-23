import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { envClient, isTestMode } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Session-aware client to fetch row (respects RLS in prod).
  const supabase = await supabaseServer();

  const { data: upload, error } = await supabase
    .from("uploads")
    .select("id,status,file_path")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!upload?.file_path) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow downloads when unlocked (or always in TEST_MODE).
  if (!isTestMode() && upload.status !== "unlocked") {
    return NextResponse.json({ error: "Locked" }, { status: 403 });
  }

  const env = envClient();
  const storage = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const objectName = upload.file_path.replace(/^uploads\//, "");
  const { data: signed, error: signErr } = await storage.storage
    .from("uploads")
    .createSignedUrl(objectName, 60 * 10, { download: true });

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message ?? "Failed to sign" }, { status: 400 });
  }

  return NextResponse.redirect(signed.signedUrl);
}

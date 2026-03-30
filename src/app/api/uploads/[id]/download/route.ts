import { NextRequest, NextResponse } from "next/server";

import { envClient, isTestMode } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Validate UUID format
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Auth check — only logged-in users can download
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to download" }, { status: 401 });
  }

  // Rate limit — 30 downloads per minute per user
  const rl = rateLimit(`download:${user.id}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many downloads. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

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

  const objectName = upload.file_path.replace(/^uploads\//, "");

  // Use server-side supabase (authed) to create signed URL
  const { data: signed, error: signErr } = await supabase.storage
    .from("uploads")
    .createSignedUrl(objectName, 60 * 5, { download: true }); // 5 min expiry, not 10

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message ?? "Failed to sign" }, { status: 400 });
  }

  return NextResponse.redirect(signed.signedUrl);
}

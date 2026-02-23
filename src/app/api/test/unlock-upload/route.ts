import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireTestMode, isTestUser } from "@/lib/test-mode";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = requireTestMode();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 404 });

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isTestUser(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as null | { uploadId?: string };
  const uploadId = body?.uploadId;
  if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });

  const { error } = await supabase
    .from("uploads")
    .update({ status: "unlocked" })
    .eq("id", uploadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

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

  // In TEST_MODE we allow anyone who can hit this endpoint (only rendered in UI during test mode)
  // to unlock. This avoids TEST_USER_EMAIL footguns during QA.
  const supabase = createClient(envC.NEXT_PUBLIC_SUPABASE_URL, envS.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const body = (await req.json().catch(() => null)) as null | { uploadId?: string };
  const uploadId = body?.uploadId;
  if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });

  const { error } = await supabase.from("uploads").update({ status: "unlocked" }).eq("id", uploadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

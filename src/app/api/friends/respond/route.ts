import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const requestId = typeof body?.requestId === "string" ? body.requestId : null;
  const action = body?.action === "accept" ? "accept" : body?.action === "reject" ? "reject" : null;
  if (!requestId || !action) return NextResponse.json({ error: "Missing requestId/action" }, { status: 400 });

  // only receiver can respond
  const { data: fr, error: frErr } = await supabase
    .from("friend_requests")
    .select("id,from_user_id,to_user_id,status")
    .eq("id", requestId)
    .maybeSingle();

  if (frErr || !fr) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (fr.to_user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (fr.status !== "pending") return NextResponse.json({ error: "Already handled" }, { status: 409 });

  const now = new Date().toISOString();
  const nextStatus = action === "accept" ? "accepted" : "rejected";

  const { error: updErr } = await supabase
    .from("friend_requests")
    .update({ status: nextStatus, responded_at: now })
    .eq("id", requestId);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: nextStatus });
}

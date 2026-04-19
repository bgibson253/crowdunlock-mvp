import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const threadId = String(id ?? "");
  if (!threadId) return NextResponse.json({ error: "Missing thread id" }, { status: 400 });

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("spend_points_for_thread_pin", { p_thread_id: threadId });
  if (error) {
    const msg = error.message ?? "error";
    const code = msg.includes("insufficient_points") ? 402 : 400;
    return NextResponse.json({ error: msg }, { status: code });
  }

  return NextResponse.json({ ok: true });
}

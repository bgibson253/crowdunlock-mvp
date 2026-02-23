import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { username?: string };
  const username = String(body?.username ?? "").trim();

  if (!username || username.length < 2 || username.length > 24) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const normalized = username.replace(/\s+/g, " ");

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username: normalized }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

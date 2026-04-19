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
  const toUserId = typeof body?.toUserId === "string" ? body.toUserId : null;
  if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });
  if (toUserId === user.id) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

  const { data, error } = await supabase
    .from("friend_requests")
    .upsert({ from_user_id: user.id, to_user_id: toUserId, status: "pending" })
    .select("id,status,from_user_id,to_user_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}

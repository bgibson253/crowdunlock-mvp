import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function randomRoomName(userId: string) {
  return `u_${userId.replace(/-/g, "").slice(0, 12)}_${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.slice(0, 120) : null;

  const now = new Date().toISOString();
  const roomName = randomRoomName(user.id);

  // First, end any stuck live rooms for this host (best-effort)
  await supabase
    .from("live_rooms")
    .update({ status: "ended", ended_at: now, updated_at: now })
    .eq("host_user_id", user.id)
    .eq("status", "live");

  const { data, error } = await supabase
    .from("live_rooms")
    .insert({
      host_user_id: user.id,
      room_name: roomName,
      title,
      status: "live",
      started_at: now,
      last_heartbeat_at: now,
      updated_at: now,
    })
    .select("id,room_name,title,status,started_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ room: data });
}

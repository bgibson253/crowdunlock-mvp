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

  // Choose a region once per live session; viewers will follow host region.
  let sfu_region: "use1" | "usw2" = "use1";
  try {
    const host = req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const res = await fetch(`${proto}://${host}/api/live/region`, { cache: "no-store" });
    const j = (await res.json().catch(() => null)) as any;
    if (j?.region === "usw2") sfu_region = "usw2";
  } catch {
    // default use1
  }

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
      sfu_region,
      started_at: now,
      last_heartbeat_at: now,
      updated_at: now,
    })
    .select("id,host_user_id,room_name,title,status,started_at,sfu_region")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ room: data });
}

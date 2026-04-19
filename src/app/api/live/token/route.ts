import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { livekitConfig } from "@/lib/livekit/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { AccessToken } = await import("livekit-server-sdk");
  const body = await req.json().catch(() => ({}));

  const roomId = typeof body?.roomId === "string" ? body.roomId : null;
  if (!roomId) return NextResponse.json({ error: "Missing roomId" }, { status: 400 });

  const { data: room, error: roomErr } = await supabase
    .from("live_rooms")
    .select("id,host_user_id,room_name,status")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr || !room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "live") return NextResponse.json({ error: "Room not live" }, { status: 409 });

  const isHost = room.host_user_id === user.id;

  const cfg = livekitConfig();
  const at = new AccessToken(cfg.apiKey, cfg.apiSecret, {
    identity: user.id,
    ttl: "2h",
  });

  at.addGrant({
    room: room.room_name,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  // host heartbeat update (best-effort)
  if (isHost) {
    const now = new Date().toISOString();
    await supabase
      .from("live_rooms")
      .update({ last_heartbeat_at: now, updated_at: now })
      .eq("id", room.id);
  }

  return NextResponse.json({
    url: cfg.url,
    token,
    roomName: room.room_name,
    isHost,
  });
}

import { NextResponse } from "next/server";

import { envServer } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const roomId = typeof body?.roomId === "string" ? body.roomId : null;
  if (!roomId) {
    return NextResponse.json({ error: "roomId_required" }, { status: 400 });
  }

  const env = envServer();

  // Simple v1 routing: use east by default. Later: choose based on host region / latency.
  const region = (body?.region === "usw2" ? "usw2" : "use1") as "use1" | "usw2";

  const sfu =
    region === "usw2"
      ? {
          region,
          httpBase: env.LIVE_SFU_USW2_HTTP ?? "http://35.89.193.133:8080",
          wsUrl: env.LIVE_SFU_USW2_WS ?? "ws://35.89.193.133:8080/ws",
        }
      : {
          region,
          httpBase: env.LIVE_SFU_USE1_HTTP ?? "http://44.201.31.59:8080",
          wsUrl: env.LIVE_SFU_USE1_WS ?? "ws://44.201.31.59:8080/ws",
        };

  return NextResponse.json({
    roomId,
    sfu,
    turn: [
      {
        urls: ["turn:44.202.221.235:3478?transport=udp", "turn:44.202.221.235:3478?transport=tcp"],
        username: "stub",
        credential: "stub",
      },
      {
        urls: ["turn:35.165.252.25:3478?transport=udp", "turn:35.165.252.25:3478?transport=tcp"],
        username: "stub",
        credential: "stub",
      },
    ],
  });
}

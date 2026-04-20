import { NextResponse } from "next/server";

import { envServer } from "@/lib/env";

export const runtime = "nodejs";

function buildTurnCreds(secret: string, ttlSeconds = 3600) {
  const username = `${Math.floor(Date.now() / 1000) + ttlSeconds}`;
  // TURN REST API: credential = base64(hmac-sha1(secret, username))
  const crypto = require("crypto") as typeof import("crypto");
  const hmac = crypto.createHmac("sha1", secret).update(username).digest("base64");
  return { username, credential: hmac };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const roomId = typeof body?.roomId === "string" ? body.roomId : null;
  if (!roomId) {
    return NextResponse.json({ error: "roomId_required" }, { status: 400 });
  }

  const env = envServer();

  const region = (body?.region === "usw2" ? "usw2" : "use1") as
    | "use1"
    | "usw2";

  const sfu =
    region === "usw2"
      ? {
          region,
          httpBase: env.LIVE_SFU_USW2_HTTP ?? "http://35.89.193.133:8080",
          wsUrl: env.LIVE_SFU_USW2_WS ?? "wss://sfu-usw2.unmaskr.org/ws",
        }
      : {
          region,
          httpBase: env.LIVE_SFU_USE1_HTTP ?? "http://44.201.31.59:8080",
          wsUrl: env.LIVE_SFU_USE1_WS ?? "wss://sfu-use1.unmaskr.org/ws",
        };

  const turnSecret = process.env.LIVE_TURN_STATIC_AUTH_SECRET;
  const creds = turnSecret ? buildTurnCreds(turnSecret, 3600) : null;

  return NextResponse.json({
    roomId,
    sfu,
    turn: [
      {
        urls: [
          "turn:44.202.221.235:3478?transport=udp",
          "turn:44.202.221.235:3478?transport=tcp",
        ],
        ...(creds ?? {}),
      },
      {
        urls: [
          "turn:35.165.252.25:3478?transport=udp",
          "turn:35.165.252.25:3478?transport=tcp",
        ],
        ...(creds ?? {}),
      },
    ],
  });
}

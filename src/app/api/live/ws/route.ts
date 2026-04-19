import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json(
    {
      error: "Live streaming transport not ready on web yet.",
      detail:
        "Secure WebSocket (wss://) for the SFU is being provisioned. Please retry in a few minutes.",
    },
    { status: 503 }
  );
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return statusLiveDisabled();
}

export async function GET() {
  return statusLiveDisabled();
}

function statusLiveDisabled() {
  return NextResponse.json(
    { error: "Live streaming is disabled for now." },
    { status: 410 }
  );
}

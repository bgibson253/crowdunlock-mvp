import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can invoke agent actions
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Rate limit — 10 agent actions per minute per user
  const rl = rateLimit(`agent-action:${user.id}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: `Rate limited. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const agentKey = process.env.OPENCLAW_AGENT_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "missing_server_env" },
      { status: 500 },
    );
  }

  const body = await req.json();
  const fnUrl = `${supabaseUrl}/functions/v1/agent-action`;

  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      ...(agentKey ? { "x-openclaw-agent-key": agentKey } : {}),
    },
    body: JSON.stringify({ ...body, user_id: user.id }),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

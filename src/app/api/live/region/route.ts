import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";
import { envServer } from "@/lib/env";

export const runtime = "nodejs";

async function canReach(url: string, timeoutMs = 900) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const env = envServer();

  const use1 = env.LIVE_SFU_USE1_HTTP ?? "http://44.201.31.59:8080";
  const usw2 = env.LIVE_SFU_USW2_HTTP ?? "http://35.89.193.133:8080";

  // v1: choose first healthy region (hard reliability win).
  // v2: switch to client RTT race + optional geo hint.
  const [use1Ok, usw2Ok] = await Promise.all([
    canReach(`${use1}/health`),
    canReach(`${usw2}/health`),
  ]);

  let region: "use1" | "usw2" = "use1";
  if (usw2Ok && !use1Ok) region = "usw2";

  return NextResponse.json({
    region,
    health: { use1: use1Ok, usw2: usw2Ok },
  });
}

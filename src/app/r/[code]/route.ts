import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Increment clicks using service-level anon key (no auth needed)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  await supabase.rpc("increment_referral_clicks", { p_code: code });

  // Redirect to auth page with ref param
  const url = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "https://crowdunlock-mvp.vercel.app");
  url.searchParams.set("ref", code);
  
  return NextResponse.redirect(url.toString());
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

/**
 * Instagram OAuth – Step 1: Redirect to Instagram authorization
 * Uses Facebook/Instagram Basic Display API (or Instagram Graph API)
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(c) { c.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Instagram OAuth not configured. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET." }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/instagram`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "instagram_business_basic",
    response_type: "code",
    state,
  });

  const authUrl = `https://www.instagram.com/oauth/authorize?${params}`;

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("ig_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}

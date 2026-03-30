import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

/**
 * Reddit OAuth – Step 1: Redirect to Reddit authorization
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

  const clientId = process.env.REDDIT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Reddit OAuth not configured. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET." }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/reddit`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    state,
    redirect_uri: redirectUri,
    duration: "temporary",
    scope: "identity",
  });

  const authUrl = `https://www.reddit.com/api/v1/authorize?${params}`;

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("rd_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}

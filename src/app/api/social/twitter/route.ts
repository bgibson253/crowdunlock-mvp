import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

/**
 * X/Twitter OAuth 2.0 PKCE – Step 1: Redirect user to Twitter authorization
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

  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Twitter OAuth not configured" }, { status: 500 });
  }

  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const state = crypto.randomBytes(16).toString("hex");
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/twitter`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "users.read tweet.read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params}`;

  // Store verifier + state in cookies (httpOnly, 10-min expiry)
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("tw_code_verifier", codeVerifier, cookieOpts);
  res.cookies.set("tw_oauth_state", state, cookieOpts);
  return res;
}

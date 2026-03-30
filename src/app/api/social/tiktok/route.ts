import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

/**
 * TikTok OAuth – Step 1: Redirect to TikTok authorization
 * Uses TikTok Login Kit v2 (PKCE)
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

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) {
    return NextResponse.json({ error: "TikTok OAuth not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET." }, { status: 500 });
  }

  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/tiktok`;

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic",
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;

  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("tt_code_verifier", codeVerifier, cookieOpts);
  res.cookies.set("tt_oauth_state", state, cookieOpts);
  return res;
}

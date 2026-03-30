import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * X/Twitter OAuth 2.0 PKCE – Step 2: Handle callback, exchange code for token, store username
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=twitter", request.url));
  }

  const storedState = request.cookies.get("tw_oauth_state")?.value;
  const codeVerifier = request.cookies.get("tw_code_verifier")?.value;

  if (!storedState || storedState !== state || !codeVerifier) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=twitter_state", request.url));
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/twitter`;

  // Exchange code for access token
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=twitter_token", request.url));
  }

  const { access_token } = await tokenRes.json();

  // Fetch the user's Twitter profile
  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=twitter_user", request.url));
  }

  const { data: twUser } = await userRes.json();
  const twitterUsername = twUser.username;

  // Save to profile
  const response = NextResponse.redirect(new URL("/profile/settings?social_connected=twitter", request.url));
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
  if (user) {
    await supabase.from("profiles").update({ twitter: twitterUsername }).eq("id", user.id);
  }

  // Clear OAuth cookies
  response.cookies.delete("tw_code_verifier");
  response.cookies.delete("tw_oauth_state");

  return response;
}

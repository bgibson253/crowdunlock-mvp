import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * TikTok OAuth – Step 2: Exchange code for token, fetch username, save to profile
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=tiktok", request.url));
  }

  const storedState = request.cookies.get("tt_oauth_state")?.value;
  const codeVerifier = request.cookies.get("tt_code_verifier")?.value;

  if (!storedState || storedState !== state || !codeVerifier) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=tiktok_state", request.url));
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/tiktok`;

  // Exchange code for access token
  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=tiktok_token", request.url));
  }

  const { access_token } = await tokenRes.json();

  // Fetch user info
  const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=username", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=tiktok_user", request.url));
  }

  const userData = await userRes.json();
  const tiktokUsername = userData?.data?.user?.username;

  // Save to profile
  const response = NextResponse.redirect(new URL("/profile/settings?social_connected=tiktok", request.url));
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
  if (user && tiktokUsername) {
    await supabase.from("profiles").update({ tiktok: tiktokUsername }).eq("id", user.id);
  }

  response.cookies.delete("tt_code_verifier");
  response.cookies.delete("tt_oauth_state");
  return response;
}

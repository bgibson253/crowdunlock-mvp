import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Reddit OAuth – Step 2: Exchange code for token, fetch username, save to profile
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=reddit", request.url));
  }

  const storedState = request.cookies.get("rd_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=reddit_state", request.url));
  }

  const clientId = process.env.REDDIT_CLIENT_ID!;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/reddit`;

  // Exchange code for access token (Reddit uses Basic auth for confidential clients)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=reddit_token", request.url));
  }

  const { access_token } = await tokenRes.json();

  // Fetch user identity
  const userRes = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "User-Agent": "Unmaskr:1.0.0 (by /u/unmaskr)",
    },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=reddit_user", request.url));
  }

  const redditUser = await userRes.json();
  const redditUsername = redditUser.name;

  // Save to profile
  const response = NextResponse.redirect(new URL("/profile/settings?social_connected=reddit", request.url));
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
  if (user && redditUsername) {
    await supabase.from("profiles").update({ reddit: redditUsername }).eq("id", user.id);
  }

  response.cookies.delete("rd_oauth_state");
  return response;
}

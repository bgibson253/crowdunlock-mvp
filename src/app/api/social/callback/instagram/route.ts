import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Instagram OAuth – Step 2: Exchange code for token, fetch username, save to profile
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=instagram", request.url));
  }

  const storedState = request.cookies.get("ig_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=instagram_state", request.url));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID!;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback/instagram`;

  // Exchange code for short-lived token
  const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=instagram_token", request.url));
  }

  const { access_token, user_id } = await tokenRes.json();

  // Fetch username
  const userRes = await fetch(`https://graph.instagram.com/v21.0/${user_id}?fields=username&access_token=${access_token}`);
  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/profile/settings?social_error=instagram_user", request.url));
  }

  const igUser = await userRes.json();
  const igUsername = igUser.username;

  // Save to profile
  const response = NextResponse.redirect(new URL("/profile/settings?social_connected=instagram", request.url));
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
    await supabase.from("profiles").update({ instagram: igUsername }).eq("id", user.id);
  }

  response.cookies.delete("ig_oauth_state");
  return response;
}

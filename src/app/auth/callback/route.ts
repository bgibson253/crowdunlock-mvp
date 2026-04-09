import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect") || "/browse";

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Check if user has a referral code in their metadata and convert
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const refCode = user.user_metadata?.referral_code;
    if (refCode) {
      await supabase.rpc("convert_referral", {
        p_code: refCode,
        p_new_user_id: user.id,
      });
    }
  }

  // Redirect back to where the user came from (only allow relative paths for safety)
  const safeDest = redirectTo.startsWith("/") ? redirectTo : "/browse";
  return NextResponse.redirect(new URL(safeDest, request.url));
}

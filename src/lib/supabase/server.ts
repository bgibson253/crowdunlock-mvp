import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { envClient } from "@/lib/env";

export async function supabaseServer() {
  const cookieStore = await cookies();
  const env = envClient();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: true,
              sameSite: "lax",
            })
          );
        } catch {
          // no-op in Server Components
        }
      },
    },
  });
}

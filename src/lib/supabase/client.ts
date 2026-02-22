import { createBrowserClient } from "@supabase/ssr";
import { envClient } from "@/lib/env";

export function supabaseBrowser() {
  const env = envClient();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

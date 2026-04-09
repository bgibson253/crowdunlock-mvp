import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Fetch the list of user IDs blocked by the current user.
 * Returns empty array if not authenticated.
 */
export async function getBlockedUserIds(): Promise<string[]> {
  const supabase = supabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", auth.user.id);

  return (data ?? []).map((b: any) => b.blocked_id);
}

/**
 * Server-side: fetch blocked user IDs for a given user
 */
export async function getBlockedUserIdsServer(
  supabase: any,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);

  return (data ?? []).map((b: any) => b.blocked_id);
}

/**
 * Check rate limit before performing an action.
 * Returns { allowed, count, limit, remaining, window } or throws.
 */
export async function checkRateLimit(
  actionType: "upload" | "thread" | "reply"
): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  window: string;
}> {
  const supabase = supabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("rate_limit_info", {
    p_user_id: auth.user.id,
    p_action_type: actionType,
  });

  if (error) throw error;
  return data as any;
}

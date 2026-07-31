import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, watchlistContributionEmailHtml } from "@/lib/email";

const THROTTLE_HOURS = 6;

/**
 * Email everyone watching an upload that it just received a contribution.
 * - Skips the contributor themselves.
 * - Throttled per watcher+upload: at most one email per THROTTLE_HOURS,
 *   tracked in watchlist_contribution_emails.
 * - Respects profiles.email_notifications_enabled.
 * Called from the Stripe webhook after current_funded is updated; must never
 * throw into the webhook path (callers wrap in try/catch anyway).
 */
export async function notifyWatchersOfContribution(
  supabase: SupabaseClient,
  {
    uploadId,
    contributorUserId,
    newFundedCents,
  }: {
    uploadId: string;
    contributorUserId: string | null;
    newFundedCents: number;
  },
) {
  const { data: upload } = await supabase
    .from("uploads")
    .select("id,title,funding_goal,status")
    .eq("id", uploadId)
    .maybeSingle();
  if (!upload) return;
  // If it just unlocked, the existing unlock email covers it — skip.
  if (upload.status === "unlocked") return;

  const { data: watchers } = await supabase
    .from("upload_watchlist")
    .select("user_id")
    .eq("upload_id", uploadId);
  if (!watchers || watchers.length === 0) return;

  const goal = upload.funding_goal ?? 0;
  const pct = goal > 0 ? Math.min(100, Math.round((newFundedCents / goal) * 100)) : 0;
  const currentDollars = Math.floor(newFundedCents / 100);
  const goalDollars = Math.floor(goal / 100);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://unmaskr.org";
  const uploadUrl = `${appUrl}/uploads/${uploadId}`;
  const cutoff = new Date(Date.now() - THROTTLE_HOURS * 3600 * 1000).toISOString();

  for (const w of watchers) {
    const watcherId = w.user_id as string;
    if (!watcherId || watcherId === contributorUserId) continue;

    // Throttle check
    const { data: recent } = await supabase
      .from("watchlist_contribution_emails")
      .select("sent_at")
      .eq("user_id", watcherId)
      .eq("upload_id", uploadId)
      .gte("sent_at", cutoff)
      .limit(1);
    if (recent && recent.length > 0) continue;

    // Notification preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notifications_enabled")
      .eq("id", watcherId)
      .maybeSingle();
    if (profile?.email_notifications_enabled === false) continue;

    const { data: authUser } = await supabase.auth.admin.getUserById(watcherId);
    const email = authUser?.user?.email;
    if (!email) continue;

    await sendEmail({
      to: email,
      subject: `"${upload.title}" just got backed — ${pct}% funded`,
      html: watchlistContributionEmailHtml(upload.title, uploadUrl, pct, currentDollars, goalDollars),
    });

    await supabase.from("watchlist_contribution_emails").upsert({
      user_id: watcherId,
      upload_id: uploadId,
      sent_at: new Date().toISOString(),
    });
  }
}

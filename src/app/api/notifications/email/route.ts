import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendEmail,
  replyEmailHtml,
  mentionEmailHtml,
  unlockEmailHtml,
  fullyFundedEmailHtml,
} from "@/lib/email";

// This route is called internally (or via webhook/trigger) to send email notifications.
// It uses the service role key so it can look up user emails.
// POST /api/notifications/email
// Body: { type: "reply"|"mention"|"unlock"|"funded", payload: {...} }

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Simple auth: require service role key or internal secret
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
    // Also allow calls from server-side (no auth header check if called internally)
    if (authHeader && !authHeader.includes(serviceKey ?? "____none")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json();
  const { type, payload } = body;

  if (!type || !payload) {
    return NextResponse.json({ error: "Missing type or payload" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(supabaseUrl, serviceKey!);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crowdunlock-mvp.vercel.app";

  const results: { userId: string; sent: boolean; reason?: string }[] = [];

  if (type === "reply") {
    // payload: { threadId, replyId, replierId, replierName, replyBody }
    const { threadId, replierId, replierName, replyBody } = payload;

    // Get thread title
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("title")
      .eq("id", threadId)
      .maybeSingle();
    const threadTitle = thread?.title || "a thread";

    // Get all subscribers to this thread
    const { data: subs } = await supabase
      .from("forum_subscriptions")
      .select("user_id")
      .eq("thread_id", threadId)
      .eq("type", "thread");

    const subscriberIds = (subs ?? [])
      .map((s: any) => s.user_id)
      .filter((id: string) => id !== replierId); // Don't email the replier

    for (const userId of subscriberIds) {
      const result = await sendNotificationEmail(supabase, userId, "email_replies", {
        threadId,
        subject: `New reply in "${threadTitle}"`,
        html: replyEmailHtml(
          threadTitle,
          replierName || "Someone",
          (replyBody || "").slice(0, 200),
          `${appUrl}/forum/${threadId}`
        ),
      });
      results.push({ userId, ...result });
    }
  } else if (type === "mention") {
    // payload: { threadId, mentionedUserIds, mentionerName, body }
    const { threadId, mentionedUserIds, mentionerName, body: mentionBody } = payload;

    const { data: thread } = await supabase
      .from("forum_threads")
      .select("title")
      .eq("id", threadId)
      .maybeSingle();
    const threadTitle = thread?.title || "a thread";

    for (const userId of mentionedUserIds ?? []) {
      const result = await sendNotificationEmail(supabase, userId, "email_mentions", {
        threadId,
        subject: `${mentionerName} mentioned you in "${threadTitle}"`,
        html: mentionEmailHtml(
          mentionerName || "Someone",
          threadTitle,
          (mentionBody || "").slice(0, 200),
          `${appUrl}/forum/${threadId}`
        ),
      });
      results.push({ userId, ...result });
    }
  } else if (type === "unlock") {
    // payload: { uploadId, uploadTitle, contributorIds }
    const { uploadId, uploadTitle, contributorIds } = payload;

    for (const userId of contributorIds ?? []) {
      const result = await sendNotificationEmail(supabase, userId, "email_unlocks", {
        subject: `🎉 "${uploadTitle}" has been unlocked!`,
        html: unlockEmailHtml(uploadTitle, `${appUrl}/uploads/${uploadId}`),
      });
      results.push({ userId, ...result });
    }
  } else if (type === "funded") {
    // payload: { uploadId, uploadTitle, uploaderId }
    const { uploadId, uploadTitle, uploaderId } = payload;

    const result = await sendNotificationEmail(supabase, uploaderId, "email_unlocks", {
      subject: `💰 "${uploadTitle}" is fully funded!`,
      html: fullyFundedEmailHtml(uploadTitle, `${appUrl}/uploads/${uploadId}`),
    });
    results.push({ userId: uploaderId, ...result });
  }

  return NextResponse.json({ ok: true, results });
}

async function sendNotificationEmail(
  supabase: any,
  userId: string,
  prefKey: string,
  email: { subject: string; html: string; threadId?: string }
): Promise<{ sent: boolean; reason?: string }> {
  // 1. Check if user has email_notifications_enabled
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_notifications_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email_notifications_enabled) {
    return { sent: false, reason: "email_disabled" };
  }

  // 2. Check specific preference
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(prefKey)
    .eq("user_id", userId)
    .maybeSingle();

  // Default to true if no prefs row exists
  if (prefs && prefs[prefKey] === false) {
    return { sent: false, reason: "pref_disabled" };
  }

  // 3. Check if user has read the in-app notification within 5 minutes (batch/delay)
  if (email.threadId) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentRead } = await supabase
      .from("forum_notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("thread_id", email.threadId)
      .gte("read_at", fiveMinAgo)
      .limit(1)
      .maybeSingle();

    if (recentRead) {
      return { sent: false, reason: "already_read" };
    }
  }

  // 4. Get user's email from auth
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  if (!user?.email) {
    return { sent: false, reason: "no_email" };
  }

  // 5. Send
  const result = await sendEmail({
    to: user.email,
    subject: email.subject,
    html: email.html,
  });

  return result ? { sent: true } : { sent: false, reason: "send_failed" };
}

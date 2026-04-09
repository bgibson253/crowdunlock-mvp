import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function digestEmailHtml(
  displayName: string,
  notifications: { type: string; count: number; items: string[] }[],
  totalCount: number,
): string {
  const itemsHtml = notifications
    .map(
      (n) => `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 14px; font-weight: 600; color: #f0f0ff; margin-bottom: 4px;">
        ${n.type === "reply" ? "💬" : n.type === "mention" ? "@" : n.type === "keyword" ? "🔑" : "🔔"} 
        ${n.count} new ${n.type}${n.count > 1 ? "s" : ""}
      </div>
      <ul style="margin: 0; padding-left: 16px; color: #a0a0c0; font-size: 13px;">
        ${n.items.slice(0, 3).map((item) => `<li style="margin-bottom: 2px;">${item}</li>`).join("")}
        ${n.count > 3 ? `<li style="color: #818cf8;">and ${n.count - 3} more…</li>` : ""}
      </ul>
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0d2e; color: #e5e5f0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #a78bfa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 32px; }
    .card { background: #1a1744; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card h2 { margin: 0 0 16px; font-size: 18px; color: #f0f0ff; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 8px; }
    .footer { text-align: center; font-size: 12px; color: #606080; margin-top: 32px; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Unmaskr</div>
    <div class="card">
      <h2>Your notification digest</h2>
      <p style="font-size: 14px; color: #a0a0c0; margin: 0 0 20px;">
        Hey ${displayName}, you have ${totalCount} unread notification${totalCount > 1 ? "s" : ""}.
      </p>
      ${itemsHtml}
      <a href="https://crowdunlock-mvp.vercel.app/forum/notifications" class="btn">View All Notifications</a>
    </div>
    <div class="footer">
      <p>You received this because you have digest notifications enabled on <a href="https://crowdunlock-mvp.vercel.app">Unmaskr</a>.</p>
      <p><a href="https://crowdunlock-mvp.vercel.app/profile/settings">Change notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

// POST /api/notifications/digest
// Call via cron. Requires Authorization: Bearer <CRON_SECRET> or service key.
export async function POST(req: NextRequest) {
  return handleDigest(req);
}

export async function GET(req: NextRequest) {
  return handleDigest(req);
}

async function handleDigest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Simple auth
  if (
    authHeader !== `Bearer ${cronSecret}` &&
    authHeader !== `Bearer ${serviceKey}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Determine which frequency to process based on request body or default to both
  const body = await req.json().catch(() => ({}));
  const frequencies: string[] = body.frequency ? [body.frequency] : ["daily", "weekly"];

  let totalSent = 0;

  for (const freq of frequencies) {
    // Find users with this digest frequency
    const { data: prefUsers } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("email_digest_frequency", freq);

    if (!prefUsers || prefUsers.length === 0) continue;

    for (const { user_id } of prefUsers) {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username, last_digest_sent_at, email_notifications_enabled")
        .eq("id", user_id)
        .maybeSingle();

      if (!profile || profile.email_notifications_enabled === false) continue;

      // Get user email
      const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
      if (!authUser?.user?.email) continue;

      // Get unread, un-emailed notifications since last digest
      const since = profile.last_digest_sent_at || new Date(0).toISOString();
      const { data: notifications } = await supabase
        .from("forum_notifications")
        .select("id, type, thread_id, created_at")
        .eq("user_id", user_id)
        .eq("read", false)
        .eq("emailed", false)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!notifications || notifications.length === 0) continue;

      // Group by type
      const grouped: Record<string, { type: string; items: string[] }> = {};
      for (const n of notifications) {
        const t = n.type || "notification";
        if (!grouped[t]) grouped[t] = { type: t, items: [] };
        grouped[t].items.push(
          `Notification in thread (${new Date(n.created_at).toLocaleDateString()})`,
        );
      }

      const groups = Object.values(grouped).map((g) => ({
        ...g,
        count: g.items.length,
      }));

      // Send digest email
      const displayName = profile.display_name || profile.username || "there";
      await sendEmail({
        to: authUser.user.email,
        subject: `Your ${freq} Unmaskr digest: ${notifications.length} new notification${notifications.length > 1 ? "s" : ""}`,
        html: digestEmailHtml(displayName, groups, notifications.length),
      });

      // Mark notifications as emailed
      const notifIds = notifications.map((n) => n.id);
      await supabase
        .from("forum_notifications")
        .update({ emailed: true })
        .in("id", notifIds);

      // Update last_digest_sent_at
      await supabase
        .from("profiles")
        .update({ last_digest_sent_at: new Date().toISOString() })
        .eq("id", user_id);

      totalSent++;
    }
  }

  return NextResponse.json({ success: true, digests_sent: totalSent });
}

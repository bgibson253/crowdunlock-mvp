import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { envClient } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/uploads/updates/notify
 * Body: { upload_id, title }
 * Sends email to all contributors of an upload when the uploader posts an update.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit — 5 update notifications per hour per user
    const rl = rateLimit(`upload-notify:${user.id}`, { maxRequests: 5, windowMs: 3600_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many notifications. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const { upload_id, title } = await req.json();
    if (!upload_id || !title) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const env = envClient();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

    // Verify user is the uploader
    const { data: upload } = await admin
      .from("uploads")
      .select("id, title, uploader_id")
      .eq("id", upload_id)
      .maybeSingle();

    if (!upload || upload.uploader_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get unique contributors with email prefs
    const { data: contributions } = await admin
      .from("contributions")
      .select("user_id")
      .eq("upload_id", upload_id);

    const uniqueUserIds = [...new Set((contributions ?? []).map((c: any) => c.user_id))];
    if (uniqueUserIds.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    // Get profiles with email enabled
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email_notifications_enabled")
      .in("id", uniqueUserIds);

    const enabledUserIds = (profiles ?? [])
      .filter((p: any) => p.email_notifications_enabled !== false)
      .map((p: any) => p.id);

    // Get emails from auth.users
    let sentCount = 0;
    for (const uid of enabledUserIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(uid);
      if (authUser?.user?.email) {
        const uploadUrl = `https://crowdunlock-mvp.vercel.app/uploads/${upload_id}`;
        const html = updateEmailHtml(upload.title, title, uploadUrl);
        await sendEmail({
          to: authUser.user.email,
          subject: `New update on "${upload.title}": ${title}`,
          html,
        });
        sentCount++;
      }
    }

    return NextResponse.json({ ok: true, sent: sentCount });
  } catch (err: any) {
    console.error("[update-notify]", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

function updateEmailHtml(uploadTitle: string, updateTitle: string, uploadUrl: string): string {
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
    .card h2 { margin: 0 0 12px; font-size: 18px; color: #f0f0ff; }
    .card p { margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #a0a0c0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 8px; }
    .footer { text-align: center; font-size: 12px; color: #606080; margin-top: 32px; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Unmaskr</div>
    <div class="card">
      <h2>📢 New update on "${uploadTitle}"</h2>
      <p><strong>${updateTitle}</strong></p>
      <p>The uploader posted a new update for a project you backed. Check it out!</p>
      <a href="${uploadUrl}" class="btn">View Update</a>
    </div>
    <div class="footer">
      <p>You received this because you contributed to this upload on <a href="https://crowdunlock-mvp.vercel.app">Unmaskr</a>.</p>
      <p><a href="https://crowdunlock-mvp.vercel.app/profile/settings">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

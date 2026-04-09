import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const FROM_EMAIL = "Unmaskr <notifications@unmaskr.org>";

function baseTemplate(content: string): string {
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
    ${content}
    <div class="footer">
      <p>You received this because you have notifications enabled on <a href="https://crowdunlock-mvp.vercel.app">Unmaskr</a>.</p>
      <p><a href="https://crowdunlock-mvp.vercel.app/profile/settings">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function replyEmailHtml(threadTitle: string, replierName: string, replyPreview: string, threadUrl: string): string {
  return baseTemplate(`
    <div class="card">
      <h2>New reply in "${threadTitle}"</h2>
      <p><strong>${replierName}</strong> replied:</p>
      <p style="border-left: 3px solid #6366f1; padding-left: 12px; font-style: italic;">${replyPreview}</p>
      <a href="${threadUrl}" class="btn">View Thread</a>
    </div>
  `);
}

export function mentionEmailHtml(mentionerName: string, threadTitle: string, preview: string, threadUrl: string): string {
  return baseTemplate(`
    <div class="card">
      <h2>${mentionerName} mentioned you</h2>
      <p>In thread: <strong>${threadTitle}</strong></p>
      <p style="border-left: 3px solid #6366f1; padding-left: 12px; font-style: italic;">${preview}</p>
      <a href="${threadUrl}" class="btn">View Thread</a>
    </div>
  `);
}

export function unlockEmailHtml(uploadTitle: string, uploadUrl: string): string {
  return baseTemplate(`
    <div class="card">
      <h2>🎉 "${uploadTitle}" has been unlocked!</h2>
      <p>An upload you contributed to has reached its funding goal and is now available for download.</p>
      <a href="${uploadUrl}" class="btn">View Upload</a>
    </div>
  `);
}

export function fullyFundedEmailHtml(uploadTitle: string, uploadUrl: string): string {
  return baseTemplate(`
    <div class="card">
      <h2>💰 "${uploadTitle}" is fully funded!</h2>
      <p>Your upload has reached its funding goal. The content will be unlocked for all contributors.</p>
      <a href="${uploadUrl}" class="btn">View Upload</a>
    </div>
  `);
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping email to", to);
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return null;
  }
}

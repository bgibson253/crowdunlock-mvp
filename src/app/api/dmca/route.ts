import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

function dmcaConfirmationHtml(claimantName: string): string {
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
    .footer { text-align: center; font-size: 12px; color: #606080; margin-top: 32px; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Unmaskr</div>
    <div class="card">
      <h2>DMCA Notice Received</h2>
      <p>Dear ${claimantName},</p>
      <p>We have received your DMCA takedown notice and it is being reviewed by our team. You can expect a response within 48 hours.</p>
      <p>If you need to provide additional information or have questions about your notice, please reply to this email or contact us at <a href="mailto:legal@unmaskr.org" style="color: #818cf8;">legal@unmaskr.org</a>.</p>
    </div>
    <div class="footer">
      <p><a href="https://crowdunlock-mvp.vercel.app">Unmaskr</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — 3 DMCA submissions per hour
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`dmca:${ip}`, { maxRequests: 3, windowMs: 3600_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many submissions. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { claimant_name, claimant_email, copyrighted_work, infringing_url, statement, signature } = body;

    if (!claimant_name || !claimant_email || !copyrighted_work || !infringing_url || !statement || !signature) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Length limits to prevent abuse
    if (claimant_name.length > 200 || claimant_email.length > 254 || copyrighted_work.length > 5000 || infringing_url.length > 2000 || statement.length > 10000 || signature.length > 200) {
      return NextResponse.json({ error: "Field too long" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimant_email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(infringing_url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Use service role to insert (no auth required for DMCA submissions)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.from("dmca_claims").insert({
      claimant_name,
      claimant_email,
      copyrighted_work,
      infringing_url,
      statement,
      signature,
    });

    if (error) {
      console.error("[dmca] Insert error:", error);
      return NextResponse.json({ error: "Failed to submit notice" }, { status: 500 });
    }

    // Send confirmation email
    await sendEmail({
      to: claimant_email,
      subject: "DMCA Takedown Notice Received: Unmaskr",
      html: dmcaConfirmationHtml(claimant_name),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[dmca] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

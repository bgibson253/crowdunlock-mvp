import { NextRequest, NextResponse } from "next/server";
import { sendEmail, replyEmailHtml } from "@/lib/email";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  if (!to) return NextResponse.json({ error: "Pass ?to=email" }, { status: 400 });

  const hasKey = !!process.env.RESEND_API_KEY;

  const html = replyEmailHtml(
    "Welcome to Unmaskr",
    "Jarvis",
    "This is a test email to verify your Resend integration is working correctly. If you're reading this — emails are live! 🎉",
    "https://crowdunlock-mvp.vercel.app/forum"
  );

  const result = await sendEmail({
    to,
    subject: "🧪 Unmaskr Email Test — It Works!",
    html,
  });

  return NextResponse.json({ hasKey, sent: !!result, result });
}

import { NextRequest, NextResponse } from "next/server";

const PROFILE_URLS: Record<string, (u: string) => string> = {
  twitter: (u) => `https://x.com/${u}`,
  instagram: (u) => `https://www.instagram.com/${u}/`,
  tiktok: (u) => `https://www.tiktok.com/@${u}`,
  reddit: (u) => `https://www.reddit.com/user/${u}/`,
};

export async function POST(req: NextRequest) {
  const { platform, username, code } = await req.json();

  if (!platform || !username || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const urlFn = PROFILE_URLS[platform];
  if (!urlFn) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  try {
    const profileUrl = urlFn(username);
    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UnmaskrBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { verified: false, error: `Could not reach ${platform} profile (HTTP ${res.status}). Check username.` },
        { status: 200 }
      );
    }

    const html = await res.text();
    const found = html.includes(code);

    return NextResponse.json({ verified: found });
  } catch (err: any) {
    return NextResponse.json(
      { verified: false, error: `Failed to check profile: ${err.message}` },
      { status: 200 }
    );
  }
}

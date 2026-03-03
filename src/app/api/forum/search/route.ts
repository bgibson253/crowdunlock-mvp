import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim();
  const section = url.searchParams.get("section");
  const author = url.searchParams.get("author");
  const dateFrom = url.searchParams.get("from");
  const dateTo = url.searchParams.get("to");
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  if (!query || query.length < 2) {
    return NextResponse.json({ threads: [], replies: [], total: 0 });
  }

  const supabase = await supabaseServer();

  // Build tsquery - handle special characters
  const tsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .join(" & ");

  if (!tsQuery) {
    return NextResponse.json({ threads: [], replies: [], total: 0 });
  }

  // Search threads
  let threadQuery = supabase
    .from("forum_threads")
    .select("id, title, body, section_id, author_id, created_at", { count: "exact" })
    .textSearch("search_vector", tsQuery)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (section) {
    threadQuery = threadQuery.eq("section_id", section);
  }
  if (author) {
    threadQuery = threadQuery.eq("author_id", author);
  }
  if (dateFrom) {
    threadQuery = threadQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    threadQuery = threadQuery.lte("created_at", dateTo);
  }

  // Search replies
  let replyQuery = supabase
    .from("forum_replies")
    .select("id, thread_id, body, author_id, created_at", { count: "exact" })
    .textSearch("search_vector", tsQuery)
    .order("created_at", { ascending: false })
    .limit(limit);

  const [threadResult, replyResult] = await Promise.all([
    threadQuery,
    replyQuery,
  ]);

  // Get thread titles for reply results
  const threadIds = [
    ...new Set((replyResult.data ?? []).map((r: any) => r.thread_id)),
  ];
  let threadTitles: Record<string, string> = {};
  if (threadIds.length > 0) {
    const { data: titles } = await supabase
      .from("forum_threads")
      .select("id, title")
      .in("id", threadIds);
    for (const t of titles ?? []) {
      threadTitles[(t as any).id] = (t as any).title;
    }
  }

  // Get author display names
  const authorIds = [
    ...new Set([
      ...(threadResult.data ?? []).map((t: any) => t.author_id),
      ...(replyResult.data ?? []).map((r: any) => r.author_id),
    ]),
  ];
  let authorNames: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      authorNames[(p as any).id] = (p as any).display_name || "Anonymous";
    }
  }

  const threads = (threadResult.data ?? []).map((t: any) => ({
    ...t,
    author_name: authorNames[t.author_id] || "Anonymous",
    snippet: t.body?.substring(0, 200) + (t.body?.length > 200 ? "…" : ""),
  }));

  const replies = (replyResult.data ?? []).map((r: any) => ({
    ...r,
    author_name: authorNames[r.author_id] || "Anonymous",
    thread_title: threadTitles[r.thread_id] || "Unknown Thread",
    snippet: r.body?.substring(0, 200) + (r.body?.length > 200 ? "…" : ""),
  }));

  return NextResponse.json({
    threads,
    replies,
    total: (threadResult.count ?? 0) + (replyResult.count ?? 0),
  });
}

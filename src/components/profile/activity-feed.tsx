import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { relativeTime } from "@/lib/relative-time";
import { MessageSquare, Reply, Upload, DollarSign } from "lucide-react";

type ActivityItem = {
  id: string;
  type: "thread" | "reply" | "upload" | "contribution";
  title: string;
  href: string;
  created_at: string;
};

export async function ActivityFeed({
  userId,
  isOwnProfile,
}: {
  userId: string;
  isOwnProfile: boolean;
}) {
  const supabase = await supabaseServer();

  // Check if user hides contributions
  const { data: profile } = await supabase
    .from("profiles")
    .select("hide_contributions")
    .eq("id", userId)
    .maybeSingle();
  const hideContributions = profile?.hide_contributions ?? false;

  // Fetch threads
  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, title, created_at, deleted_at")
    .eq("author_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch replies
  const { data: replies } = await supabase
    .from("forum_replies")
    .select("id, body, thread_id, created_at, deleted_at")
    .eq("author_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get thread titles for replies
  const replyThreadIds = Array.from(new Set((replies ?? []).map((r: any) => r.thread_id)));
  const { data: replyThreads } = replyThreadIds.length
    ? await supabase.from("forum_threads").select("id, title").in("id", replyThreadIds)
    : { data: [] as any[] };
  const threadTitleMap: Record<string, string> = {};
  for (const t of (replyThreads ?? []) as any[]) {
    threadTitleMap[t.id] = t.title;
  }

  // Fetch uploads
  const { data: uploads } = await supabase
    .from("uploads")
    .select("id, title, created_at")
    .eq("uploader_id", userId)
    .in("status", ["funding", "unlocked"])
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch contributions (only if not hidden, or if own profile)
  let contributions: any[] = [];
  if (!hideContributions || isOwnProfile) {
    const { data: contribs } = await supabase
      .from("contributions")
      .select("id, upload_id, created_at, amount")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (contribs && contribs.length > 0) {
      const uploadIds = Array.from(new Set(contribs.map((c: any) => c.upload_id)));
      const { data: contribUploads } = await supabase
        .from("uploads")
        .select("id, title")
        .in("id", uploadIds);
      const uploadTitleMap: Record<string, string> = {};
      for (const u of (contribUploads ?? []) as any[]) {
        uploadTitleMap[u.id] = u.title;
      }
      contributions = contribs.map((c: any) => ({
        ...c,
        upload_title: uploadTitleMap[c.upload_id] ?? "an upload",
      }));
    }
  }

  // Build unified timeline
  const items: ActivityItem[] = [];

  for (const t of (threads ?? []) as any[]) {
    items.push({
      id: `thread-${t.id}`,
      type: "thread",
      title: `Started thread "${t.title}"`,
      href: `/forum/${t.id}`,
      created_at: t.created_at,
    });
  }

  for (const r of (replies ?? []) as any[]) {
    const threadTitle = threadTitleMap[r.thread_id] ?? "a thread";
    items.push({
      id: `reply-${r.id}`,
      type: "reply",
      title: `Replied in "${threadTitle}"`,
      href: `/forum/${r.thread_id}`,
      created_at: r.created_at,
    });
  }

  for (const u of (uploads ?? []) as any[]) {
    items.push({
      id: `upload-${u.id}`,
      type: "upload",
      title: `Created upload "${u.title}"`,
      href: `/uploads/${u.id}`,
      created_at: u.created_at,
    });
  }

  for (const c of contributions) {
    items.push({
      id: `contrib-${c.id}`,
      type: "contribution",
      title: `Contributed to "${c.upload_title}"`,
      href: `/uploads/${c.upload_id}`,
      created_at: c.created_at,
    });
  }

  // Sort by date descending, limit to 50
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const timeline = items.slice(0, 50);

  const iconMap: Record<string, React.ReactNode> = {
    thread: <MessageSquare className="h-4 w-4 text-primary" />,
    reply: <Reply className="h-4 w-4 text-emerald-400" />,
    upload: <Upload className="h-4 w-4 text-amber-400" />,
    contribution: <DollarSign className="h-4 w-4 text-green-400" />,
  };

  if (timeline.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-1">
      {timeline.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/30"
        >
          <div className="mt-0.5 shrink-0">
            {iconMap[item.type]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground line-clamp-1">{item.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {relativeTime(item.created_at)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

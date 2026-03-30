import Link from "next/link";
import { Eye, MessageSquare, Lock, Pin, CheckCircle2 } from "lucide-react";
import { relativeTime } from "@/lib/relative-time";

export function ThreadListItem({
  id,
  title,
  createdAt,
  viewCount = 0,
  replyCount = 0,
  locked = false,
  pinned = false,
  deleted = false,
  hasSolution = false,
}: {
  id: string;
  title: string;
  createdAt: string;
  viewCount?: number;
  replyCount?: number;
  locked?: boolean;
  pinned?: boolean;
  deleted?: boolean;
  hasSolution?: boolean;
}) {
  if (deleted) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/30 px-4 py-3 opacity-40">
        <span className="text-sm text-muted-foreground italic">[deleted]</span>
      </div>
    );
  }

  return (
    <Link href={`/forum/${id}`} className="block">
      <div className="card-hover group rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {pinned && (
                <span className="inline-flex h-5 items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-400">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}
              {locked && (
                <Lock className="h-3.5 w-3.5 text-red-400/70 shrink-0" />
              )}
              {hasSolution && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1.5">
              <span>{relativeTime(createdAt)}</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3 opacity-60" />
                {viewCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3 opacity-60" />
                {replyCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

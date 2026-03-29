import Link from "next/link";
import { Eye, MessageSquare, Lock, Pin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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
}: {
  id: string;
  title: string;
  createdAt: string;
  viewCount?: number;
  replyCount?: number;
  locked?: boolean;
  pinned?: boolean;
  deleted?: boolean;
}) {
  if (deleted) {
    return (
      <Card className="opacity-50">
        <CardContent className="py-4">
          <span className="text-sm text-muted-foreground italic">[deleted]</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition hover:border-indigo-200 hover:bg-indigo-50/30">
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {pinned && (
                <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              {locked && (
                <Lock className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <Link
                className="font-medium tracking-tight hover:underline truncate"
                href={`/forum/${id}`}
              >
                {title}
              </Link>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
              <span>{relativeTime(createdAt)}</span>
              <span className="inline-flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {viewCount}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <MessageSquare className="h-3 w-3" />
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

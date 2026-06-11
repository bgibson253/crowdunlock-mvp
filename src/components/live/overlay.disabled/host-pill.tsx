"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function HostPill(props: {
  host: { id: string; username: string; displayName: string; avatarUrl?: string | null };
  className?: string;
}) {
  const label = props.host.displayName || props.host.username || "Creator";
  const handle = props.host.username ? `@${props.host.username}` : "";

  return (
    <Link
      href={props.host.username ? `/live/${encodeURIComponent(props.host.username)}` : `/profile/${encodeURIComponent(props.host.id)}`}
      className={cn(
        "pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-1 backdrop-blur hover:bg-black/50",
        props.className
      )}
      title="Open profile"
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src={props.host.avatarUrl ?? undefined} />
        <AvatarFallback className="text-[10px]">{label.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="max-w-[160px] truncate text-[11px] font-semibold text-white">{label}</div>
        {handle ? <div className="max-w-[160px] truncate text-[10px] text-white/70">{handle}</div> : null}
      </div>
    </Link>
  );
}

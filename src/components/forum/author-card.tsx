import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserFavoriteButton } from "@/components/forum/user-favorite-button";
import { UserSubscribeButton } from "@/components/forum/user-subscribe-button";

export function AuthorCard({
  author,
  compact = false,
}: {
  author: null | {
    id: string;
    username: string | null;
    display_name?: string | null;
    avatar_url: string | null;
    post_count: number | null;
    unlock_tier_label?: string | null;
    unlock_tier_icon?: string | null;
  };
  compact?: boolean;
}) {
  if (!author) {
    if (compact) {
      return (
        <div className="flex flex-col items-center gap-0.5 text-center">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[9px]">A</AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-medium">Administrator</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <div className="font-medium">Administrator</div>
          <div className="text-xs text-muted-foreground">System</div>
        </div>
      </div>
    );
  }

  const name = author.display_name ?? author.username ?? "User";
  const posts = author.post_count ?? 0;
  const badgeText = author.unlock_tier_label ?? null;
  const badgeIcon = author.unlock_tier_icon ?? null;

  if (compact) {
    return (
      <div>
        <Link href={`/profile/${author.id}`} className="flex flex-col items-center gap-0.5 text-center hover:underline">
          <Avatar className="h-6 w-6">
            {author.avatar_url ? <AvatarImage src={author.avatar_url} alt={name} /> : null}
            <AvatarFallback className="text-[9px]">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-medium leading-none truncate max-w-[80px]">{name}</span>
        </Link>
        <div className="flex flex-col items-center text-[9px] text-muted-foreground leading-tight">
          {badgeText && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-1 py-0 font-medium text-amber-200 text-[9px]">
              <span aria-hidden>{badgeIcon ?? "💸"}</span>
              <span className="truncate">{badgeText}</span>
            </span>
          )}
          <span>{posts} posts</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/profile/${author.id}`} className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {author.avatar_url ? <AvatarImage src={author.avatar_url} alt={name} /> : null}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-sm min-w-0">
          <div className="font-medium leading-4 truncate">{name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {badgeText ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                <span aria-hidden>{badgeIcon ?? "💸"}</span>
                <span className="truncate">{badgeText}</span>
              </span>
            ) : null}
            <span>{posts} posts</span>
          </div>
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-0.5">
        <UserFavoriteButton targetUserId={author.id} />
        <UserSubscribeButton targetUserId={author.id} />
      </div>
    </div>
  );
}

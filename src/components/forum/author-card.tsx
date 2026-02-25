import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AuthorCard({
  author,
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
}) {
  if (!author) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <div className="font-medium">Unknown</div>
          <div className="text-xs text-muted-foreground">—</div>
        </div>
      </div>
    );
  }

  const name = author.display_name ?? author.username ?? "User";
  const handle = author.username ? `@${author.username}` : null;
  const posts = author.post_count ?? 0;
  const badgeText = author.unlock_tier_label ?? null;
  const badgeIcon = author.unlock_tier_icon ?? null;

  return (
    <Link href={`/profile/${author.id}`} className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        {author.avatar_url ? <AvatarImage src={author.avatar_url} alt={name} /> : null}
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="text-sm min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-medium leading-4 truncate">{name}</div>
          {badgeText ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
              <span aria-hidden>{badgeIcon ?? "💸"}</span>
              <span className="truncate">{badgeText}</span>
            </span>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground">
          {handle ? <span className="mr-2">{handle}</span> : null}
          <span>{posts} posts</span>
        </div>
      </div>
    </Link>
  );
}

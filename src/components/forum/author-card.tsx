import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AuthorCard({
  author,
}: {
  author: null | {
    id: string;
    username: string | null;
    avatar_url: string | null;
    post_count: number | null;
  };
}) {
  if (!author) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <div className="font-medium">Administrator</div>
          <div className="text-xs text-muted-foreground">—</div>
        </div>
      </div>
    );
  }

  const name = author.username ?? "User";
  const posts = author.post_count ?? 0;

  return (
    <Link href={`/profile/${author.id}`} className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        {author.avatar_url ? <AvatarImage src={author.avatar_url} alt={name} /> : null}
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="text-sm">
        <div className="font-medium leading-4">{name}</div>
        <div className="text-xs text-muted-foreground">{posts} posts</div>
      </div>
    </Link>
  );
}

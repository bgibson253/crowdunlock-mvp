import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserFavoriteButton } from "@/components/forum/user-favorite-button";
import { UserSubscribeButton } from "@/components/forum/user-subscribe-button";
import { getTrustLevelName } from "@/lib/trust-levels";

/* ── Tier‑badge gradient colors (higher = more dramatic) ──────── */
const TIER_GRADIENT: Record<string, string> = {
  "First Bill":       "from-zinc-400 to-zinc-600",
  "Half Stack":       "from-zinc-400 to-zinc-600",
  "It's all about the Benjamin": "from-emerald-400 to-emerald-600",
  "It's all about the Benjamins": "from-emerald-400 to-emerald-600",
  "Three-Plate Stack": "from-emerald-400 to-emerald-600",
  "Money Talks":       "from-amber-400 to-yellow-500",
  "Paper Trail":       "from-amber-400 to-yellow-500",
  "Four-Figure Financier": "from-amber-300 to-orange-500",
  "Double-K Patron":   "from-cyan-400 to-blue-500",
  "Quiet Backer":      "from-violet-400 to-purple-600",
  "Kingmaker":         "from-yellow-300 to-amber-500",
  "Shadow Sponsor":    "from-slate-400 to-slate-700",
  "Dealmaker":         "from-rose-400 to-pink-600",
  "The Vault Opens":   "from-yellow-300 to-red-500",
  "The Mask Breaker":  "from-fuchsia-400 to-purple-600",
  "The Unmasker":      "from-indigo-300 to-blue-600",
  "The Final Reveal":  "from-yellow-200 via-amber-400 to-red-600",
};

function TierBadge({ label, icon }: { label: string; icon: string }) {
  const grad = TIER_GRADIENT[label] ?? "from-amber-400 to-yellow-500";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-gradient-to-r ${grad} bg-clip-text text-transparent px-1.5 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap`}
      title={label}
    >
      <span className="bg-clip-border text-[10px] not-italic" aria-hidden>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function TrustBadge({ level }: { level: number }) {
  const name = getTrustLevelName(level);
  const colors: Record<number, string> = {
    0: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10",
    1: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    2: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    3: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    4: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  };
  const cls = colors[level] ?? colors[0];
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap ${cls}`}>
      {name}
    </span>
  );
}

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
    trust_level?: number | null;
    total_points?: number | null;
    current_streak?: number | null;
    unlock_tier_label?: string | null;
    unlock_tier_icon?: string | null;
  };
  compact?: boolean;
}) {
  if (!author) {
    if (compact) {
      return (
        <div className="flex flex-col items-center gap-0.5 text-center">
          <Avatar className="h-6 w-6 ring-1 ring-border/50">
            <AvatarFallback className="text-[9px] bg-muted">A</AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-medium text-muted-foreground">Administrator</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-border/50">
          <AvatarFallback className="bg-muted">A</AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <div className="font-semibold">Administrator</div>
          <div className="text-xs text-muted-foreground">System</div>
        </div>
      </div>
    );
  }

  const name = author.display_name ?? author.username ?? "User";
  const posts = author.post_count ?? 0;
  const trustLevel = author.trust_level ?? 0;
  const points = author.total_points ?? 0;
  const streak = author.current_streak ?? 0;
  const badgeText = author.unlock_tier_label ?? null;
  const badgeIcon = author.unlock_tier_icon ?? null;

  /* ── Compact layout (thread OP sidebar + reply sidebar) ───── */
  if (compact) {
    return (
      <div className="w-[110px]">
        <Link href={`/profile/${author.id}`} className="flex flex-col items-center gap-0.5 text-center hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            {author.avatar_url ? <AvatarImage src={author.avatar_url} alt={name} /> : null}
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-semibold leading-tight text-center break-words max-w-full">{name}</span>
        </Link>

        {/* Badges stack */}
        <div className="mt-1 flex flex-col items-center gap-1">
          {/* Trust level */}
          <TrustBadge level={trustLevel} />

          {/* Spending tier */}
          {badgeText && <TierBadge label={badgeText} icon={badgeIcon ?? "💸"} />}

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground leading-tight">
            <span>{posts} posts</span>
            {points > 0 && <span>⭐ {points.toLocaleString()}</span>}
          </div>

          {/* Streak */}
          {streak >= 2 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-orange-400 font-medium">
              🔥 {streak}d streak
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── Full layout (used on mobile horizontal row) ───── */
  return (
    <div>
      <Link href={`/profile/${author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          {author.avatar_url ? <AvatarImage src={author.avatar_url} alt={name} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-sm min-w-0">
          <div className="font-semibold leading-4">{name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <TrustBadge level={trustLevel} />
            {badgeText && <TierBadge label={badgeText} icon={badgeIcon ?? "💸"} />}
            <span>{posts} posts</span>
            {points > 0 && <span>⭐ {points.toLocaleString()}</span>}
            {streak >= 2 && (
              <span className="text-orange-400 font-medium">🔥 {streak}d</span>
            )}
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

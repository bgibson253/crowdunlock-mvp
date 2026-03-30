"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";

interface Achievement {
  achievement_id: string;
  earned_at: string;
  achievements: { title: string; description: string; icon: string } | null;
}

export function AchievementBadges({ userId, limit = 5 }: { userId: string; limit?: number }) {
  const [badges, setBadges] = useState<Achievement[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at, achievements(title, description, icon)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })
        .limit(limit);
      if (data) setBadges(data as any);
    }
    load();
  }, [userId, limit]);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.achievement_id}
          title={`${b.achievements?.title}: ${b.achievements?.description}`}
          className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20 cursor-default hover:bg-primary/20 transition-colors"
        >
          {b.achievements?.icon} {b.achievements?.title}
        </span>
      ))}
    </div>
  );
}

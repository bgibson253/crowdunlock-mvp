"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Achievement {
  achievement_id: string;
  earned_at: string;
  achievements: { title: string; description: string; icon: string; category?: string } | null;
}

export function AchievementBadges({ userId, limit = 12 }: { userId: string; limit?: number }) {
  const [badges, setBadges] = useState<Achievement[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at, achievements(title, description, icon, category)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })
        .limit(limit);
      if (data) setBadges(data as any);
    }
    load();
  }, [userId, limit]);

  if (badges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <Tooltip key={b.achievement_id}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20 cursor-default hover:bg-primary/20 transition-colors">
                {b.achievements?.icon} {b.achievements?.title}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{b.achievements?.title}</p>
              <p className="text-xs text-muted-foreground">{b.achievements?.description}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Earned {new Date(b.earned_at).toLocaleDateString()}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

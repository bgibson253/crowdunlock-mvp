"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Flame } from "lucide-react";
import { toast } from "sonner";

export function StreakIndicator({ userId }: { userId: string }) {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("current_streak")
        .eq("id", userId)
        .maybeSingle();
      if (data) setStreak(data.current_streak);
    }
    load();
  }, [userId]);

  if (!streak || streak < 2) return null;

  return (
    <div className="flex items-center gap-1 text-xs font-bold text-amber-400" title={`${streak}-day streak`}>
      <Flame className="h-3.5 w-3.5" />
      {streak}
    </div>
  );
}

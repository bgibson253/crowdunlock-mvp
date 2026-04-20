"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { Poll } from "@/components/live/overlay/types";

export function PollCard(props: { poll: Poll; className?: string }) {
  const total = useMemo(
    () => props.poll.options.reduce((a, o) => a + o.votes, 0),
    [props.poll]
  );

  return (
    <Card className={cn("border-white/10 bg-white/5 p-3", props.className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Quick poll</div>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-1 text-sm text-foreground/90">{props.poll.question}</div>

      <div className="mt-3 space-y-2">
        {props.poll.options.map((o) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0;
          return (
            <div key={o.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{o.label}</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-2 bg-white/10" />
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="bg-white/5 border border-white/10 hover:bg-white/10"
          disabled
        >
          Vote (placeholder)
        </Button>
        <Button variant="ghost" className="text-muted-foreground" disabled>
          Create poll (placeholder)
        </Button>
      </div>
    </Card>
  );
}

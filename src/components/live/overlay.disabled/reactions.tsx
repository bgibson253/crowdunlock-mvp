"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, Laugh, PartyPopper, ThumbsUp, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Reaction } from "@/components/live/overlay/types";

const reactions: Reaction[] = [
  { key: "like", label: "Like", emoji: "👍" },
  { key: "hype", label: "Hype", emoji: "⚡" },
  { key: "love", label: "Love", emoji: "❤️" },
  { key: "lol", label: "LOL", emoji: "😂" },
  { key: "party", label: "Party", emoji: "🎉" },
];

function iconFor(key: string) {
  if (key === "like") return ThumbsUp;
  if (key === "hype") return Zap;
  if (key === "love") return Heart;
  if (key === "lol") return Laugh;
  return PartyPopper;
}

export function ReactionBar(props: {
  onReact: (key: string) => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", props.className)}>
      {reactions.map((r) => {
        const Icon = iconFor(r.key);
        return (
          <Button
            key={r.key}
            size={props.compact ? "sm" : "default"}
            variant="secondary"
            className="bg-white/5 border border-white/10 hover:bg-white/10"
            onClick={() => props.onReact(r.key)}
            aria-label={`React: ${r.label}`}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{r.label}</span>
            <span className="sm:hidden">{r.emoji}</span>
          </Button>
        );
      })}
    </div>
  );
}

export function BurstReactions(props: {
  bursts: Array<{ id: string; emoji: string }>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {props.bursts.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: -120, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="absolute bottom-6 right-8 text-3xl"
          >
            {b.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

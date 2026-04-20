"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ShieldAlert } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { ChatMessage } from "@/components/live/overlay/types";

function initials(username: string) {
  const u = username.trim();
  return (u[0] || "?").toUpperCase();
}

export function ChatPanel(props: {
  me: { id: string; username: string; avatarUrl?: string | null } | null;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  collapsed?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [sticky, setSticky] = useState(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const formatted = useMemo(() => {
    return props.messages.map((m) => ({
      ...m,
      time: format(new Date(m.createdAt), "p"),
    }));
  }, [props.messages]);

  useEffect(() => {
    if (!sticky) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [formatted.length, sticky]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setSticky(nearBottom);
  };

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    props.onSend(t);
    setDraft("");
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col", props.className)}>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="text-sm font-semibold">Live chat</div>
        <Badge variant="secondary" className="bg-white/5 text-foreground border-white/10">
          <ShieldAlert className="mr-1 h-3.5 w-3.5" />
          Moderation: on
        </Badge>
      </div>

      <div className="px-3">
        <div className="h-px w-full bg-white/10" />
      </div>

      <div className="relative min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="h-full overflow-y-auto px-3 py-3"
            aria-label="Chat message list"
          >
            <AnimatePresence initial={false}>
              {formatted.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="mb-2 flex gap-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {initials(m.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="truncate text-xs font-semibold">
                        {m.user.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{m.time}</span>
                      {m.user.role === "mod" && (
                        <Badge className="h-4 px-1.5 py-0 text-[10px] bg-indigo-500/20 text-indigo-200 border-indigo-300/20">
                          mod
                        </Badge>
                      )}
                      {m.user.role === "host" && (
                        <Badge className="h-4 px-1.5 py-0 text-[10px] bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-300/20">
                          host
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm leading-snug text-foreground/90 break-words">
                      {m.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {!sticky && (
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 grid place-items-center">
            <Badge className="pointer-events-auto cursor-pointer bg-black/60 text-white border-white/10" onClick={() => setSticky(true)}>
              New messages — jump to latest
            </Badge>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={props.me ? "Send a message" : "Sign in to chat"}
              disabled={!props.me}
              className="min-h-[44px] resize-none border-white/10 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              aria-label="Chat message input"
            />
            <Button onClick={send} disabled={!props.me || !draft.trim()} className="h-10">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Profanity filter: placeholder (wire your own). Messages are sanitized.
          </div>
        </div>
      </div>
    </div>
  );
}

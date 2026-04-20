import { create } from "zustand";

import type { AlertEvent, ChatMessage, Poll } from "@/components/live/overlay/types";

export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "offline";

type LiveState = {
  conn: ConnectionState;
  setConn: (c: ConnectionState) => void;

  viewerCount: number;
  setViewerCount: (n: number) => void;

  messages: ChatMessage[];
  pushMessage: (m: ChatMessage) => void;
  setMessages: (m: ChatMessage[]) => void;

  alerts: Array<{ id: string; event: AlertEvent; createdAt: number }>;
  pushAlert: (e: AlertEvent) => void;
  popAlert: () => void;

  poll: Poll | null;
  setPoll: (p: Poll | null) => void;
};

export const useLiveStore = create<LiveState>((set, get) => ({
  conn: "idle",
  setConn: (conn) => set({ conn }),

  viewerCount: 0,
  setViewerCount: (viewerCount) => set({ viewerCount }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  pushMessage: (m) => {
    const prev = get().messages;
    // keep last 250 for perf
    const next = [...prev, m].slice(-250);
    set({ messages: next });
  },

  alerts: [],
  pushAlert: (event) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const createdAt = Date.now();
    set({ alerts: [...get().alerts, { id, event, createdAt }].slice(-6) });
  },
  popAlert: () => set({ alerts: get().alerts.slice(1) }),

  poll: null,
  setPoll: (poll) => set({ poll }),
}));

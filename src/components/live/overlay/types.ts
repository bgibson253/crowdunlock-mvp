export type Branding = {
  accent: string; // css color (hsl/hex)
  accent2?: string;
  logoText?: string;
};

export type StreamConfig = {
  title: string;
  host: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  // Optional: HLS playback (only used on HLS pages; WebRTC pages can omit)
  hlsUrl?: string;
  // Socket.io endpoint for chat + realtime overlay events
  chatWsUrl: string;
  roomId: string;
  startedAt: number; // ms epoch
  isLive: boolean;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    role?: "host" | "mod" | "viewer";
  };
  text: string;
  createdAt: number; // ms
};

export type AlertEvent =
  | { t: "follow"; user: string }
  | { t: "donation"; user: string; amountUsd: number }
  | { t: "sub"; user: string; months?: number }
  | { t: "gift"; user: string; giftName: string };

export type Reaction = {
  key: string;
  label: string;
  emoji: string;
};

export type Poll = {
  id: string;
  question: string;
  options: { id: string; label: string; votes: number }[];
  endsAt: number; // ms
};

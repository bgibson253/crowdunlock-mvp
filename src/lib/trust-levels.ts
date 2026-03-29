// Trust level constants — single source of truth for the app.
// Enforcement in UI components + API routes references these.

export const TRUST_LEVELS = {
  0: {
    name: "Newbie",
    scoreMin: 0,
    scoreMax: 99,
    postsPerDay: 10,
    canReply: true,
    canSearch: false,
    canFlag: false,
    canPostImages: false,
    canEmbedVideo: false,
    canCreateTopic: false,
    canPinThreads: false,
    canVoteOnTags: false,
    description: "New user. 10 posts/day, text-only, reactions.",
  },
  1: {
    name: "Member",
    scoreMin: 100,
    scoreMax: 299,
    postsPerDay: 50,
    canReply: true,
    canSearch: true,
    canFlag: true,
    canPostImages: false,
    canEmbedVideo: false,
    canCreateTopic: false,
    canPinThreads: false,
    canVoteOnTags: true,
    description: "Active member. 50 posts/day, reply, search, flag content, vote on tags.",
  },
  2: {
    name: "Regular",
    scoreMin: 300,
    scoreMax: 599,
    postsPerDay: null, // unlimited
    canReply: true,
    canSearch: true,
    canFlag: true,
    canPostImages: true, // AI-scanned
    canEmbedVideo: false,
    canCreateTopic: false,
    canPinThreads: false,
    canVoteOnTags: true,
    description: "Regular. Unlimited text posts, images (AI-scanned), polls.",
  },
  3: {
    name: "Trusted",
    scoreMin: 600,
    scoreMax: 899,
    postsPerDay: null,
    canReply: true,
    canSearch: true,
    canFlag: true,
    canPostImages: true,
    canEmbedVideo: true, // embed YouTube/Vimeo/etc links
    canCreateTopic: false,
    canPinThreads: false,
    canVoteOnTags: true,
    description: "Trusted. Can embed video links (YouTube, Vimeo, etc.) in posts.",
  },
  4: {
    name: "Leader",
    scoreMin: 900,
    scoreMax: Infinity,
    postsPerDay: null,
    canReply: true,
    canSearch: true,
    canFlag: true,
    canPostImages: true,
    canEmbedVideo: true,
    canCreateTopic: true, // exactly 1 lifetime topic
    maxTopics: 1, // lifetime cap — warn before creating
    canPinThreads: true,
    canVoteOnTags: true,
    description: "Leader. Can create 1 forum topic (lifetime). Pin threads.",
  },
} as const;

export type TrustLevel = keyof typeof TRUST_LEVELS;

export function getTrustConfig(level: number) {
  const clamped = Math.max(0, Math.min(4, level)) as TrustLevel;
  return TRUST_LEVELS[clamped];
}

export function getTrustLevelName(level: number): string {
  return getTrustConfig(level).name;
}

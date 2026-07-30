export type UnlockTier = {
  dollars: number;
  label: string;
  icon: string;
  /** Short flavor line shown on the perks page */
  blurb: string;
};

// Visible ladder — matches the DB tier functions exactly
// (supabase/migrations/20260730210000_unlock_tiers_coherent.sql).
export const UNLOCK_TIERS: UnlockTier[] = [
  {
    dollars: 20,
    label: "First Bill",
    icon: "🧾",
    blurb: "Every stack starts with a single bill.",
  },
  {
    dollars: 100,
    label: "It's All About the Benjamin",
    icon: "💵",
    blurb: "One hundred. The realest portrait in America.",
  },
  {
    dollars: 200,
    label: "It's All About the Benjamins",
    icon: "💵💵",
    blurb: "Plural. Now it's a lifestyle.",
  },
  {
    dollars: 500,
    label: "Stacking Hundreds",
    icon: "💰",
    blurb: "Benjamins on Benjamins on Benjamins.",
  },
  {
    dollars: 1000,
    label: "Money Printer",
    icon: "🖨️💸",
    blurb: "Brrrr. Four figures of unlocked truth.",
  },
  {
    dollars: 5000,
    label: "Cash Vault",
    icon: "🏦",
    blurb: "The door is heavy. You hold the combination.",
  },
  {
    dollars: 10000,
    label: "Midas Touch",
    icon: "👑✨",
    blurb: "Everything you back turns to gold.",
  },
  {
    dollars: 50000,
    label: "The Whale",
    icon: "🐋",
    blurb: "When you surface, the whole ocean notices.",
  },
  {
    dollars: 100000,
    label: "Unmaskr Legend",
    icon: "👁️⚡",
    blurb: "The final reveal. Your name is the watermark.",
  },
];

export function tierForGrossDollars(gross: number): UnlockTier | null {
  let best: UnlockTier | null = null;
  for (const t of UNLOCK_TIERS) {
    if (gross >= t.dollars) best = t;
  }
  return best;
}

export function nextTierForGrossDollars(gross: number): UnlockTier | null {
  for (const t of UNLOCK_TIERS) {
    if (gross < t.dollars) return t;
  }
  return null;
}

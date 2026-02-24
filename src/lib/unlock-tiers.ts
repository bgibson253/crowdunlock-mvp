export type UnlockTier = {
  dollars: number;
  label: string;
  icon: string;
};

// Visible ladder (marketing) — what users can unlock.
export const UNLOCK_TIERS: UnlockTier[] = [
  { dollars: 20, label: "First Bill", icon: "🧾" },
  { dollars: 50, label: "Half Stack", icon: "🟩" },
  { dollars: 100, label: "It's all about the Benjamin", icon: "💵" },
  { dollars: 200, label: "It's all about the Benjamins", icon: "💵💵" },
  { dollars: 300, label: "Three-Plate Stack", icon: "🧱" },
  { dollars: 500, label: "Money Talks", icon: "📣💰" },
  { dollars: 750, label: "Paper Trail", icon: "🧾🕵️" },
  { dollars: 1000, label: "Four-Figure Financier", icon: "🏦" },
  { dollars: 2000, label: "Double-K Patron", icon: "💎" },
  { dollars: 5000, label: "Quiet Backer", icon: "🕶️" },
  { dollars: 10000, label: "Kingmaker", icon: "👑" },
  { dollars: 25000, label: "Shadow Sponsor", icon: "🌑" },
  { dollars: 50000, label: "Dealmaker", icon: "🤝💼" },
  { dollars: 100000, label: "The Vault Opens", icon: "🗝️" },
  { dollars: 250000, label: "The Mask Breaker", icon: "🎭⚡" },
  { dollars: 500000, label: "The Unmasker", icon: "🜁" },
  { dollars: 1000000, label: "The Final Reveal", icon: "👁️" },
];

export function tierForGrossDollars(gross: number): UnlockTier | null {
  let best: UnlockTier | null = null;
  for (const t of UNLOCK_TIERS) {
    if (gross >= t.dollars) best = t;
  }
  return best;
}

export type CoinPack = {
  id: string;
  name: string;
  usdCents: number;
  coins: number;
};

// Tuned to feel TikTok-ish: a little bonus at higher tiers.
export const COIN_PACKS: CoinPack[] = [
  { id: "pack_499", name: "Starter", usdCents: 499, coins: 500 },
  { id: "pack_999", name: "Supporter", usdCents: 999, coins: 1100 },
  { id: "pack_1999", name: "Booster", usdCents: 1999, coins: 2400 },
  { id: "pack_4999", name: "Super", usdCents: 4999, coins: 6500 },
  { id: "pack_9999", name: "Whale", usdCents: 9999, coins: 14000 },
];

export function getCoinPack(packId: string): CoinPack | null {
  return COIN_PACKS.find((p) => p.id === packId) ?? null;
}

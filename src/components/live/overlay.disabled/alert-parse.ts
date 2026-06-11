import type { AlertEvent } from "@/components/live/overlay/types";

export function coerceAlertEvent(input: unknown): AlertEvent | null {
  const e = input as any;
  if (!e || typeof e !== "object") return null;

  if (e.t === "follow" && typeof e.user === "string") return { t: "follow", user: e.user };
  if (e.t === "donation" && typeof e.user === "string" && typeof e.amountUsd === "number")
    return { t: "donation", user: e.user, amountUsd: e.amountUsd };
  if (e.t === "sub" && typeof e.user === "string")
    return { t: "sub", user: e.user, months: typeof e.months === "number" ? e.months : undefined };
  if (e.t === "gift" && typeof e.user === "string" && typeof e.giftName === "string")
    return { t: "gift", user: e.user, giftName: e.giftName };

  return null;
}

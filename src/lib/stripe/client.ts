import { loadStripe } from "@stripe/stripe-js";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function stripeBrowser() {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) return null;
  if (!stripePromise) stripePromise = loadStripe(pk);
  return stripePromise;
}

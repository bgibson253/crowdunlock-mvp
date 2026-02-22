import Stripe from "stripe";

export function stripeServer() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Stripe isn't set up yet for this MVP; keep build/deploy working.
    // API routes that depend on Stripe should handle the null case.
    return null;
  }
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

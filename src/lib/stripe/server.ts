import Stripe from "stripe";

export function stripeServer() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" });
}

import { envServer, isTestMode } from "@/lib/env";

export function requireTestMode() {
  if (!isTestMode()) {
    return { ok: false as const, error: "Not found" };
  }
  return { ok: true as const };
}

export function isTestUser(email?: string | null) {
  if (!isTestMode()) return false;
  const env = envServer();
  const allowed = env.TEST_USER_EMAIL;
  if (!allowed) return false;
  if (!email) return false;
  return email.toLowerCase() === allowed.toLowerCase();
}

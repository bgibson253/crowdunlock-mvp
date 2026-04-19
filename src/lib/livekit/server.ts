import { envClient } from "@/lib/env";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function livekitConfig() {
  const env = envClient();
  const url = required("LIVEKIT_URL");
  const apiKey = required("LIVEKIT_API_KEY");
  const apiSecret = required("LIVEKIT_API_SECRET");

  return {
    url,
    apiKey,
    apiSecret,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  };
}

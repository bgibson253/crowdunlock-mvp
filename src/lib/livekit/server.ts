import { envClient } from "@/lib/env";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function livekitConfig() {
  const env = envClient();
  const url = required("LIVEKIT_URL").trim();
  const apiKey = required("LIVEKIT_API_KEY").trim();
  const apiSecret = required("LIVEKIT_API_SECRET").trim();

  return {
    url,
    apiKey,
    apiSecret,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  };
}

export async function livekitServerClient() {
  const { RoomServiceClient } = await import("livekit-server-sdk");
  const cfg = livekitConfig();
  return new RoomServiceClient(cfg.url, cfg.apiKey, cfg.apiSecret);
}

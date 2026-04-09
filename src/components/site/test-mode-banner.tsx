import { isTestMode } from "@/lib/env";

export function TestModeBanner() {
  if (!isTestMode()) return null;

  return (
    <div className="w-full border-b border-red-600 bg-red-600 text-white">
      <div className="mx-auto max-w-6xl px-4 py-2 text-center text-sm font-semibold tracking-tight">
        TEST MODE: Payments disabled. This is not live.
      </div>
    </div>
  );
}

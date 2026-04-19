import Link from "next/link";
import { COIN_PACKS } from "@/lib/coins/packs";

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Wallet</h1>
      <p className="mt-2 text-sm text-muted-foreground">Buy coins to send gifts in the forum and on lives.</p>

      <div className="mt-6 grid gap-3">
        {COIN_PACKS.map((p) => (
          <form
            key={p.id}
            action={async () => {
              "use server";
              // Placeholder: use client fetch to /api/coins/checkout and redirect.
            }}
          >
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.coins.toLocaleString()} coins</div>
              </div>
              <div className="text-sm font-medium">${(p.usdCents / 100).toFixed(2)}</div>
            </div>
          </form>
        ))}
      </div>

      <div className="mt-8 text-sm">
        <Link className="underline" href="/earnings">
          Go to Earnings
        </Link>
      </div>
    </div>
  );
}

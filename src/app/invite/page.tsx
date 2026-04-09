import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { ReferralSection } from "@/components/referral/referral-section";
import { envClient } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Invite Friends",
  description: "Share your invite link and earn referral badges on Unmaskr.",
};

export default async function InvitePage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=%2Finvite");

  // Get user's referral code
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  if (!profile?.referral_code) {
    // Generate one if missing
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    await supabase
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", user.id);
    // Reload
    redirect("/invite");
  }

  // Get stats
  const { data: statsData } = await supabase.rpc("get_referral_stats", {
    p_user_id: user.id,
  });

  const stats = Array.isArray(statsData) && statsData.length > 0
    ? statsData[0]
    : { total_referrals: 0, converted: 0, total_clicks: 0 };

  const env = envClient();

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Invite Friends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your invite link to earn referral badges. Hit 5, 25, or 100 conversions to level up.
          </p>
        </div>

        <ReferralSection
          referralCode={profile.referral_code}
          stats={stats}
          appUrl={env.NEXT_PUBLIC_APP_URL}
        />
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Welcome to Unmaskr" };

export default async function OnboardingPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, has_onboarded")
    .eq("id", user.id)
    .maybeSingle();

  // Already onboarded — go to browse
  if (profile?.has_onboarded) redirect("/browse");

  // Fetch categories for interest selection
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon, sort_order")
    .order("sort_order", { ascending: true });

  // Fetch top 5 creators by upload count
  const { data: topCreators } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, post_count")
    .gt("post_count", 0)
    .order("post_count", { ascending: false })
    .limit(5);

  return (
    <div className="relative isolate min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <OnboardingWizard
        userId={user.id}
        initialProfile={{
          display_name: profile?.display_name ?? "",
          username: profile?.username ?? "",
          avatar_url: profile?.avatar_url ?? null,
        }}
        categories={(categories ?? []) as any[]}
        topCreators={(topCreators ?? []).filter((c: any) => c.id !== user.id) as any[]}
      />
    </div>
  );
}

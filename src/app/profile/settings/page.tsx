import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { NotificationPreferences } from "@/components/profile/notification-preferences";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile Settings" };

export default async function ProfileSettingsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,website,location,twitter,github,linkedin,avatar_url,banner_url")
    .eq("id", data.user.id)
    .maybeSingle();

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Profile settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your public username and avatar.
          </p>
        </div>

        <ProfileSettingsForm
          initial={{
            id: data.user.id,
            display_name: (profile as any)?.display_name ?? (profile as any)?.username ?? "",
            bio: (profile as any)?.bio ?? "",
            website: (profile as any)?.website ?? "",
            location: (profile as any)?.location ?? "",
            twitter: (profile as any)?.twitter ?? "",
            github: (profile as any)?.github ?? "",
            linkedin: (profile as any)?.linkedin ?? "",
            avatar_url: (profile as any)?.avatar_url ?? null,
            banner_url: (profile as any)?.banner_url ?? null,
          }}
        />

        <div className="mt-8">
          <NotificationPreferences userId={data.user.id} />
        </div>
      </div>
    </div>
  );
}

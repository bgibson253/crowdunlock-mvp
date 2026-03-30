import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { NotificationPreferences } from "@/components/profile/notification-preferences";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
    .select("id,username,bio,twitter,instagram,tiktok,reddit,sig_bio,sig_twitter,sig_instagram,sig_tiktok,sig_reddit,avatar_url,banner_url,username_changed_at")
    .eq("id", data.user.id)
    .maybeSingle();

  const p = profile as any;

  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Profile settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize your profile, avatar, and forum signature.
          </p>
        </div>

        <ProfileSettingsForm
          initial={{
            id: data.user.id,
            username: p?.username ?? "",
            bio: p?.bio ?? "",
            twitter: p?.twitter ?? "",
            instagram: p?.instagram ?? "",
            tiktok: p?.tiktok ?? "",
            reddit: p?.reddit ?? "",
            sig_bio: p?.sig_bio ?? false,
            sig_twitter: p?.sig_twitter ?? false,
            sig_instagram: p?.sig_instagram ?? false,
            sig_tiktok: p?.sig_tiktok ?? false,
            sig_reddit: p?.sig_reddit ?? false,
            avatar_url: p?.avatar_url ?? null,
            banner_url: p?.banner_url ?? null,
            username_changed_at: p?.username_changed_at ?? null,
          }}
        />

        <div className="mt-10">
          <NotificationPreferences userId={data.user.id} />
        </div>

        {/* Danger zone */}
        <div className="mt-10 pt-8 border-t border-destructive/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-destructive">Delete account</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently remove your account and anonymize your data.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50">
              <Link href="/profile/delete">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

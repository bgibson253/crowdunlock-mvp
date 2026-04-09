"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Prefs = {
  email_replies: boolean;
  email_mentions: boolean;
  email_keywords: boolean;
  email_dms: boolean;
  email_unlocks: boolean;
  push_enabled: boolean;
};

const defaults: Prefs = {
  email_replies: true,
  email_mentions: true,
  email_keywords: false,
  email_dms: true,
  email_unlocks: true,
  push_enabled: true,
};

export function NotificationPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setPrefs({
          email_replies: data.email_replies ?? true,
          email_mentions: data.email_mentions ?? true,
          email_keywords: data.email_keywords ?? false,
          email_dms: data.email_dms ?? true,
          email_unlocks: data.email_unlocks ?? true,
          push_enabled: data.push_enabled ?? true,
        });
      }

      // Load profile-level email toggle
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_notifications_enabled")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        setEmailEnabled(profile.email_notifications_enabled ?? true);
      }

      setLoaded(true);
    }
    load();
  }, [userId]);

  async function toggle(key: keyof Prefs) {
    const newVal = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newVal }));
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, [key]: newVal }, { onConflict: "user_id" });
    if (error) {
      toast.error("Failed to save preference");
      setPrefs((p) => ({ ...p, [key]: !newVal }));
    }
  }

  async function toggleEmailEnabled() {
    const newVal = !emailEnabled;
    setEmailEnabled(newVal);
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("profiles")
      .update({ email_notifications_enabled: newVal })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to update email preference");
      setEmailEnabled(!newVal);
    }
  }

  if (!loaded) return null;

  const emailItems: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: "email_replies", label: "Replies", desc: "When someone replies to a thread you're subscribed to" },
    { key: "email_mentions", label: "Mentions", desc: "When someone @mentions you" },
    { key: "email_unlocks", label: "Unlocks", desc: "When an upload you contributed to gets unlocked or fully funded" },
    { key: "email_keywords", label: "Keywords", desc: "When your keyword subscriptions match" },
    { key: "email_dms", label: "Direct messages", desc: "When you receive a direct message" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Master email toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Label className="text-sm font-semibold">Email notifications</Label>
            <p className="text-xs text-muted-foreground">Master toggle for all email notifications</p>
          </div>
          <Switch checked={emailEnabled} onCheckedChange={toggleEmailEnabled} />
        </div>

        {emailEnabled && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email me about…</p>
              {emailItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={prefs[item.key]}
                    onCheckedChange={() => toggle(item.key)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />

        {/* In-app */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Label className="text-sm font-medium">In-app notifications</Label>
            <p className="text-xs text-muted-foreground">Show notification bell badge</p>
          </div>
          <Switch
            checked={prefs.push_enabled}
            onCheckedChange={() => toggle("push_enabled")}
          />
        </div>
      </CardContent>
    </Card>
  );
}

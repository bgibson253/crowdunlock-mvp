"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Prefs = {
  email_replies: boolean;
  email_mentions: boolean;
  email_keywords: boolean;
  email_dms: boolean;
  push_enabled: boolean;
};

const defaults: Prefs = {
  email_replies: true,
  email_mentions: true,
  email_keywords: false,
  email_dms: true,
  push_enabled: true,
};

export function NotificationPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Prefs>(defaults);
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
        setPrefs(data as any);
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

  if (!loaded) return null;

  const items: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: "email_replies", label: "Reply notifications", desc: "When someone replies to a thread you're subscribed to" },
    { key: "email_mentions", label: "Mention notifications", desc: "When someone @mentions you" },
    { key: "email_keywords", label: "Keyword notifications", desc: "When your keyword subscriptions match" },
    { key: "email_dms", label: "DM notifications", desc: "When you receive a direct message" },
    { key: "push_enabled", label: "In-app notifications", desc: "Show notification bell badge" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
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
      </CardContent>
    </Card>
  );
}

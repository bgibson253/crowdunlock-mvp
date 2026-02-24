"use client";

import * as React from "react";

import { supabaseBrowser } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileSettingsForm({
  initial,
}: {
  initial: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}) {
  const [username, setUsername] = React.useState(initial.username);
  const [avatarUrl, setAvatarUrl] = React.useState<string>(initial.avatar_url ?? "");
  const [file, setFile] = React.useState<File | null>(null);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You must be signed in.");

      let nextAvatarUrl = avatarUrl.trim() || null;

      if (file) {
        const ext = file.name.split(".").pop() || "png";
        const path = `avatars/${auth.user.id}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;

        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        nextAvatarUrl = data.publicUrl;
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .upsert({ id: auth.user.id, username: username.trim() || null, avatar_url: nextAvatarUrl });

      if (updErr) throw updErr;

      setNotice("Saved.");
      setFile(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="py-6 space-y-6">
        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">{notice}</div>
        ) : null}

        <form onSubmit={onSave} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={username || "User"} /> : null}
              <AvatarFallback>{(username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium">Preview</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{username || "(no username)"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your public name"
              autoComplete="nickname"
            />
            <p className="text-xs text-muted-foreground">
              This is shown next to your posts.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-file">Avatar (upload)</Label>
            <Input
              id="avatar-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Uploading replaces your existing avatar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-url">Avatar URL (optional)</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              autoComplete="url"
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

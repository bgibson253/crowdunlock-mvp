"use client";

import * as React from "react";

import { supabaseBrowser } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

const urlOrEmpty = (s: string) => {
  const v = s.trim();
  if (!v) return null;
  try {
    // allow http(s) only
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return v;
  } catch {
    return null;
  }
};

export function ProfileSettingsForm({
  initial,
}: {
  initial: {
    id: string;
    display_name: string;
    bio: string;
    website: string;
    location: string;
    twitter: string;
    github: string;
    linkedin: string;
    avatar_url: string | null;
    banner_url: string | null;
  };
}) {
  const [displayName, setDisplayName] = React.useState(initial.display_name);
  const [bio, setBio] = React.useState(initial.bio);
  const [website, setWebsite] = React.useState(initial.website);
  const [location, setLocation] = React.useState(initial.location);
  const [twitter, setTwitter] = React.useState(initial.twitter);
  const [github, setGithub] = React.useState(initial.github);
  const [linkedin, setLinkedin] = React.useState(initial.linkedin);

  const [avatarUrl, setAvatarUrl] = React.useState<string>(initial.avatar_url ?? "");
  const [bannerUrl, setBannerUrl] = React.useState<string>(initial.banner_url ?? "");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);

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

      let nextAvatarUrl: string | null = urlOrEmpty(avatarUrl) ?? null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "png";
        const path = `avatars/${auth.user.id}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (upErr) throw upErr;

        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        nextAvatarUrl = data.publicUrl;
      }

      const payload = {
        id: auth.user.id,
        // NO username editing. display_name is the public label.
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        website: urlOrEmpty(website),
        location: location.trim() || null,
        twitter: twitter.trim() || null,
        github: github.trim() || null,
        linkedin: linkedin.trim() || null,
        avatar_url: nextAvatarUrl,
        banner_url: urlOrEmpty(bannerUrl),
      };

      const { error: updErr } = await supabase.from("profiles").upsert(payload);
      if (updErr) throw updErr;

      setNotice("Saved.");
      setAvatarFile(null);
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

        <div className="space-y-2">
          <div className="text-sm font-medium">Preview</div>
          {bannerUrl ? (
            <div className="h-24 w-full overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-24 w-full border bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-amber-100" />
          )}
          <div className="-mt-7 flex items-center gap-4 px-4">
            <Avatar className="h-14 w-14 border bg-background">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName || "User"} /> : null}
              <AvatarFallback>{(displayName || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 pt-6">
              <div className="text-base font-semibold leading-5 line-clamp-1">
                {displayName || "(no display name)"}
              </div>
              {location ? (
                <div className="text-xs text-muted-foreground line-clamp-1">{location}</div>
              ) : null}
            </div>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="display">Display name</Label>
            <Input
              id="display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder="What do you plan to upload? Credibility, sources, and focus."
            />
            <div className="text-xs text-muted-foreground">{bio.length}/280</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                autoComplete="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                autoComplete="address-level2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="twitter">X / Twitter</Label>
              <Input
                id="twitter"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@handle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="profile slug"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-file">Avatar (upload)</Label>
            <Input
              id="avatar-file"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="avatar-url">Avatar URL (optional)</Label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-url">Banner URL (optional)</Label>
              <Input
                id="banner-url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

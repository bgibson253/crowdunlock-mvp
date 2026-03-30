"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropper } from "@/components/profile/image-cropper";
import { toast } from "sonner";
import {
  Camera, Pencil, Check, Clock, Link2, ShieldCheck, ShieldAlert,
  Copy, Loader2, X as XIcon,
} from "lucide-react";

/* ─── Types ─── */
type SocialKey = "twitter" | "instagram" | "tiktok" | "reddit";
type SigKey = `sig_${SocialKey}`;

interface ProfileInitial {
  id: string;
  username: string;
  bio: string;
  twitter: string;
  instagram: string;
  tiktok: string;
  reddit: string;
  sig_bio: boolean;
  sig_twitter: boolean;
  sig_instagram: boolean;
  sig_tiktok: boolean;
  sig_reddit: boolean;
  avatar_url: string | null;
  banner_url: string | null;
  username_changed_at: string | null;
}

interface Verification {
  platform: string;
  username: string;
  verification_code: string;
  verified: boolean;
}

const SOCIALS: {
  key: SocialKey; label: string; prefix: string; icon: string;
  url: (u: string) => string; bioHint: string;
}[] = [
  { key: "twitter", label: "X / Twitter", prefix: "@", icon: "𝕏",
    url: (u) => `https://x.com/${u}`, bioHint: "Paste the code into your X bio" },
  { key: "instagram", label: "Instagram", prefix: "@", icon: "📷",
    url: (u) => `https://instagram.com/${u}`, bioHint: "Paste the code into your Instagram bio" },
  { key: "tiktok", label: "TikTok", prefix: "@", icon: "🎵",
    url: (u) => `https://tiktok.com/@${u}`, bioHint: "Paste the code into your TikTok bio" },
  { key: "reddit", label: "Reddit", prefix: "u/", icon: "🟠",
    url: (u) => `https://reddit.com/u/${u}`, bioHint: "Paste the code into your Reddit bio/about" },
];

function generateCode(): string {
  return `unmaskr-${Math.random().toString(36).slice(2, 10)}`;
}

function canChangeUsername(changedAt: string | null): { allowed: boolean; nextDate: Date | null } {
  if (!changedAt) return { allowed: true, nextDate: null };
  const next = new Date(changedAt);
  next.setMonth(next.getMonth() + 6);
  return { allowed: new Date() >= next, nextDate: next };
}

export function ProfileSettingsForm({ initial }: { initial: ProfileInitial }) {
  const searchParams = useSearchParams();

  /* ─── State ─── */
  const [bio, setBio] = React.useState(initial.bio);
  const [sigBio, setSigBio] = React.useState(initial.sig_bio);

  const [socials, setSocials] = React.useState<Record<SocialKey, string>>({
    twitter: initial.twitter,
    instagram: initial.instagram,
    tiktok: initial.tiktok,
    reddit: initial.reddit,
  });
  const [sigs, setSigs] = React.useState<Record<SigKey, boolean>>({
    sig_twitter: initial.sig_twitter,
    sig_instagram: initial.sig_instagram,
    sig_tiktok: initial.sig_tiktok,
    sig_reddit: initial.sig_reddit,
  });

  // Verification state
  const [verifications, setVerifications] = React.useState<Record<SocialKey, Verification | null>>({
    twitter: null, instagram: null, tiktok: null, reddit: null,
  });
  const [verifying, setVerifying] = React.useState<SocialKey | null>(null);

  const [avatarPreview, setAvatarPreview] = React.useState<string>(initial.avatar_url ?? "");
  const [bannerPreview, setBannerPreview] = React.useState<string>(initial.banner_url ?? "");
  const [avatarBlob, setAvatarBlob] = React.useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = React.useState<Blob | null>(null);

  // Cropper state
  const [cropperSrc, setCropperSrc] = React.useState<string | null>(null);
  const [cropperMode, setCropperMode] = React.useState<"avatar" | "banner">("avatar");

  // Username change
  const [showUsernameEdit, setShowUsernameEdit] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState(initial.username);
  const usernameChange = canChangeUsername(initial.username_changed_at);

  const [saving, setSaving] = React.useState(false);

  /* ─── Load verifications on mount ─── */
  React.useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("social_verifications")
        .select("platform, username, verification_code, verified")
        .eq("user_id", initial.id);
      if (data) {
        const map: Record<string, Verification> = {};
        for (const row of data) map[row.platform] = row;
        setVerifications((prev) => ({ ...prev, ...map } as any));
      }
    }
    load();
  }, [initial.id]);

  /* ─── Toasts ─── */
  React.useEffect(() => {
    const connected = searchParams.get("social_connected");
    if (connected) toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} saved!`);
  }, [searchParams]);

  /* ─── File pickers ─── */
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileSelect(mode: "avatar" | "banner") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setCropperSrc(url);
      setCropperMode(mode);
      e.target.value = "";
    };
  }

  function handleCropComplete(blob: Blob) {
    const url = URL.createObjectURL(blob);
    if (cropperMode === "avatar") {
      setAvatarBlob(blob);
      setAvatarPreview(url);
    } else {
      setBannerBlob(blob);
      setBannerPreview(url);
    }
    setCropperSrc(null);
  }

  /* ─── Start verification: generate code + upsert row ─── */
  async function startVerification(key: SocialKey) {
    const username = socials[key]?.trim();
    if (!username) { toast.error("Enter a username first."); return; }

    const code = generateCode();
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("social_verifications").upsert({
      user_id: initial.id,
      platform: key,
      username,
      verification_code: code,
      verified: false,
      verified_at: null,
    }, { onConflict: "user_id,platform" });

    if (error) { toast.error("Failed to start verification."); return; }

    setVerifications((p) => ({
      ...p,
      [key]: { platform: key, username, verification_code: code, verified: false },
    }));
    toast.success("Code generated! Copy it to your bio, then click Verify.");
  }

  /* ─── Check verification: call API to scrape profile for code ─── */
  async function checkVerification(key: SocialKey) {
    const v = verifications[key];
    if (!v) return;

    setVerifying(key);
    try {
      const res = await fetch("/api/social/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: key, username: v.username, code: v.verification_code }),
      });
      const json = await res.json();

      if (json.verified) {
        const supabase = supabaseBrowser();
        await supabase.from("social_verifications").update({
          verified: true,
          verified_at: new Date().toISOString(),
        }).eq("user_id", initial.id).eq("platform", key);

        setVerifications((p) => ({
          ...p,
          [key]: { ...v, verified: true },
        }));
        toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} verified! ✓`);
      } else {
        toast.error(json.error || "Code not found in your bio. Make sure it's visible and try again.");
      }
    } catch {
      toast.error("Verification check failed. Try again.");
    } finally {
      setVerifying(null);
    }
  }

  /* ─── Remove social ─── */
  async function removeSocial(key: SocialKey) {
    const supabase = supabaseBrowser();
    await supabase.from("social_verifications").delete().eq("user_id", initial.id).eq("platform", key);
    await supabase.from("profiles").update({ [key]: null, [`sig_${key}`]: false }).eq("id", initial.id);
    setSocials((p) => ({ ...p, [key]: "" }));
    setSigs((p) => ({ ...p, [`sig_${key}`]: false }));
    setVerifications((p) => ({ ...p, [key]: null }));
    toast.success("Removed.");
  }

  /* ─── Save ─── */
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You must be signed in.");

      let nextAvatarUrl: string | null = avatarPreview || null;
      let nextBannerUrl: string | null = bannerPreview || null;

      if (avatarBlob) {
        const path = `avatars/${auth.user.id}_${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(path, avatarBlob, { contentType: "image/jpeg" });
        if (upErr) throw new Error(`Avatar upload failed: ${upErr.message}`);
        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        nextAvatarUrl = data.publicUrl;
      }

      if (bannerBlob) {
        const path = `banners/${auth.user.id}_${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(path, bannerBlob, { contentType: "image/jpeg" });
        if (upErr) throw new Error(`Banner upload failed: ${upErr.message}`);
        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        nextBannerUrl = data.publicUrl;
      }

      // Only save sig flags for verified accounts
      const payload: Record<string, unknown> = {
        id: auth.user.id,
        bio: bio.trim() || null,
        sig_bio: sigBio,
        twitter: socials.twitter.trim() || null,
        instagram: socials.instagram.trim() || null,
        tiktok: socials.tiktok.trim() || null,
        reddit: socials.reddit.trim() || null,
        sig_twitter: verifications.twitter?.verified ? sigs.sig_twitter : false,
        sig_instagram: verifications.instagram?.verified ? sigs.sig_instagram : false,
        sig_tiktok: verifications.tiktok?.verified ? sigs.sig_tiktok : false,
        sig_reddit: verifications.reddit?.verified ? sigs.sig_reddit : false,
        avatar_url: nextAvatarUrl,
        banner_url: nextBannerUrl,
      };

      if (showUsernameEdit && newUsername.trim() !== initial.username && usernameChange.allowed) {
        const cleaned = newUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
        if (cleaned.length < 3) throw new Error("Username must be at least 3 characters.");
        if (cleaned.length > 24) throw new Error("Username must be 24 characters or fewer.");
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleaned)
          .neq("id", auth.user.id)
          .maybeSingle();
        if (existing) throw new Error("That username is already taken.");
        payload.username = cleaned;
        payload.username_changed_at = new Date().toISOString();
      }

      const { error: updErr } = await supabase.from("profiles").upsert(payload);
      if (updErr) throw updErr;

      setAvatarBlob(null);
      setBannerBlob(null);
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          aspect={cropperMode === "avatar" ? 1 : 3}
          outputWidth={cropperMode === "avatar" ? 400 : 1200}
          title={cropperMode === "avatar" ? "Crop avatar" : "Crop banner"}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperSrc(null)}
        />
      )}

      <form onSubmit={onSave} className="space-y-8">
        {/* ─── Banner + Avatar ─── */}
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="relative group h-36 sm:h-44">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                <Camera className="h-3.5 w-3.5" /> Change banner
              </span>
            </button>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("banner")} />
          </div>

          <div className="relative px-5 -mt-12 pb-5">
            <div className="relative inline-block group">
              <Avatar className="h-24 w-24 rounded-xl ring-4 ring-card shadow-xl">
                {avatarPreview ? <AvatarImage src={avatarPreview} alt={initial.username || "User"} className="rounded-xl" /> : null}
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl font-bold">
                  {(initial.username || "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 group-hover:bg-black/40 transition-all"
              >
                <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("avatar")} />
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold">@{initial.username}</div>
            </div>
          </div>
        </div>

        {/* ─── Username Change ─── */}
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Username</h2>
            {!showUsernameEdit && (
              <Button type="button" variant="outline" size="sm" disabled={!usernameChange.allowed}
                onClick={() => setShowUsernameEdit(true)} className="border-border/50 text-xs">
                <Pencil className="h-3 w-3 mr-1" /> Request change
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Current: <span className="font-mono text-foreground">@{initial.username}</span>
          </div>
          {!usernameChange.allowed && usernameChange.nextDate && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Clock className="h-3 w-3" />
              Next change available {usernameChange.nextDate.toLocaleDateString()}
            </div>
          )}
          {showUsernameEdit && usernameChange.allowed && (
            <div className="space-y-2">
              <input value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="new_username" maxLength={24}
                className="w-full rounded-lg border border-primary/30 bg-background/50 px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <p className="text-[11px] text-muted-foreground">
                Lowercase letters, numbers, underscores, hyphens. 3–24 chars. Once every 6 months.
              </p>
            </div>
          )}
        </div>

        {/* ─── Bio ─── */}
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Bio</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] text-muted-foreground">Add to signature</span>
              <input type="checkbox" checked={sigBio} onChange={(e) => setSigBio(e.target.checked)}
                className="accent-primary h-3.5 w-3.5 rounded" />
            </label>
          </div>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={280}
            placeholder="Tell people about yourself…"
            className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <div className="text-[11px] text-muted-foreground text-right">{bio.length}/280</div>
        </div>

        {/* ─── Social Accounts ─── */}
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-5">
          <h2 className="text-sm font-bold">Social accounts</h2>
          <p className="text-[11px] text-muted-foreground -mt-2">
            Add your username, then verify ownership by placing a code in your bio. Only verified accounts can be added to your signature.
          </p>
          <div className="space-y-4">
            {SOCIALS.map((s) => {
              const value = socials[s.key];
              const v = verifications[s.key];
              const isVerified = v?.verified && v.username === value;
              const hasPendingCode = v && !v.verified && v.username === value;

              return (
                <div key={s.key} className="rounded-xl border border-border/30 bg-background/30 px-4 py-3 space-y-3">
                  {/* Row 1: icon + input + status */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-base shrink-0">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono shrink-0">{s.prefix}</span>
                        <input
                          value={value}
                          onChange={(e) => {
                            const v2 = e.target.value.replace(/^@/, "").replace(/\s/g, "");
                            setSocials((p) => ({ ...p, [s.key]: v2 }));
                          }}
                          placeholder={`${s.label} username`}
                          maxLength={50}
                          disabled={isVerified}
                          className="w-full bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Status badge */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : value ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium shrink-0">
                        <ShieldAlert className="h-3.5 w-3.5" /> Unverified
                      </span>
                    ) : null}

                    {/* Signature checkbox — only if verified */}
                    {isVerified && (
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0" title="Add to forum signature">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">Signature</span>
                        <input type="checkbox"
                          checked={sigs[`sig_${s.key}` as SigKey]}
                          onChange={(e) => setSigs((p) => ({ ...p, [`sig_${s.key}`]: e.target.checked }))}
                          className="accent-primary h-3.5 w-3.5 rounded" />
                      </label>
                    )}

                    {/* Link to profile */}
                    {value && (
                      <a href={s.url(value)} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors shrink-0"
                        title={`View ${s.label} profile`}>
                        <Link2 className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Row 2: Verification actions */}
                  {value && !isVerified && (
                    <div className="pl-9 space-y-2">
                      {!hasPendingCode ? (
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => startVerification(s.key)}
                          className="border-primary/30 text-primary hover:bg-primary/10 text-xs">
                          Generate verification code
                        </Button>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-background/80 border border-border/50 rounded px-2 py-1 font-mono select-all">
                              {v.verification_code}
                            </code>
                            <button type="button"
                              onClick={() => { navigator.clipboard.writeText(v.verification_code); toast.success("Code copied!"); }}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy code">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{s.bioHint}, then:</p>
                          <div className="flex items-center gap-2">
                            <Button type="button" size="sm"
                              disabled={verifying === s.key}
                              onClick={() => checkVerification(s.key)}
                              className="bg-primary hover:bg-primary/90 text-xs">
                              {verifying === s.key ? (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking…</>
                              ) : (
                                <><Check className="h-3 w-3 mr-1" /> Verify now</>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Remove button for verified accounts */}
                  {isVerified && (
                    <div className="pl-9">
                      <button type="button" onClick={() => removeSocial(s.key)}
                        className="text-[11px] text-destructive/70 hover:text-destructive transition-colors flex items-center gap-1">
                        <XIcon className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Save ─── */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8">
            <Check className="h-4 w-4 mr-1.5" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </>
  );
}

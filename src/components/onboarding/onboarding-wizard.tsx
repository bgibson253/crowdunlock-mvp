"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, SkipForward, Upload, CheckCircle2, User, Camera, Heart, Users, Loader2 } from "lucide-react";

type Category = { id: string; name: string; slug: string; icon: string };
type Creator = { id: string; display_name: string; username: string; avatar_url: string | null; post_count: number };

interface Props {
  userId: string;
  initialProfile: { display_name: string; username: string; avatar_url: string | null };
  categories: Category[];
  topCreators: Creator[];
}

export function OnboardingWizard({ userId, initialProfile, categories, topCreators }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile
  const [displayName, setDisplayName] = useState(initialProfile.display_name);
  const [username, setUsername] = useState(initialProfile.username);

  // Step 2: Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile.avatar_url);

  // Step 3: Interests
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 4: Follow
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);

  const totalSteps = 4;

  const saveStep1 = useCallback(async () => {
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return false;
    }
    setLoading(true);
    const supabase = supabaseBrowser();
    const updates: any = { display_name: displayName.trim() };
    if (username.trim()) {
      updates.username = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "Username already taken" : "Failed to save profile");
      return false;
    }
    return true;
  }, [displayName, username, userId]);

  const saveStep2 = useCallback(async () => {
    if (!avatarFile) return true; // skip if no file
    setLoading(true);
    const supabase = supabaseBrowser();
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (uploadError) {
      toast.error("Failed to upload avatar");
      setLoading(false);
      return false;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    setLoading(false);
    return true;
  }, [avatarFile, userId]);

  const saveStep3 = useCallback(async () => {
    if (selectedCategories.length === 0) return true; // skip
    setLoading(true);
    const supabase = supabaseBrowser();
    // Delete existing, insert new
    await supabase.from("user_interests").delete().eq("user_id", userId);
    const rows = selectedCategories.map((category_id) => ({ user_id: userId, category_id }));
    const { error } = await supabase.from("user_interests").insert(rows);
    setLoading(false);
    if (error) {
      toast.error("Failed to save interests");
      return false;
    }
    return true;
  }, [selectedCategories, userId]);

  const saveStep4 = useCallback(async () => {
    if (followedCreators.length === 0) return true;
    setLoading(true);
    const supabase = supabaseBrowser();
    for (const creatorId of followedCreators) {
      await supabase.from("user_subscriptions").upsert(
        { user_id: userId, target_user_id: creatorId },
        { onConflict: "user_id,target_user_id" },
      );
    }
    setLoading(false);
    return true;
  }, [followedCreators, userId]);

  const completeOnboarding = useCallback(async () => {
    setLoading(true);
    const supabase = supabaseBrowser();
    await supabase.from("profiles").update({ has_onboarded: true }).eq("id", userId);
    setLoading(false);
    toast.success("Welcome to Unmaskr! 🎉");
    router.push("/browse");
  }, [userId, router]);

  async function handleNext() {
    let ok = true;
    if (step === 1) ok = await saveStep1();
    else if (step === 2) ok = await saveStep2();
    else if (step === 3) ok = await saveStep3();
    else if (step === 4) {
      ok = await saveStep4();
      if (ok) {
        await completeOnboarding();
        return;
      }
    }
    if (ok && step < totalSteps) setStep(step + 1);
  }

  async function handleSkip() {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be under 5MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function toggleCreator(id: string) {
    setFollowedCreators((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const stepIcons = [User, Camera, Heart, Users];
  const StepIcon = stepIcons[step - 1];

  return (
    <div className="w-full max-w-lg px-4">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i + 1 <= step ? "bg-primary w-8" : "bg-muted w-6"
            }`}
          />
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <StepIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {step === 1 && "Set up your profile"}
            {step === 2 && "Add a profile photo"}
            {step === 3 && "Pick your interests"}
            {step === 4 && "Follow creators"}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1 && "Choose a display name and username for the community."}
            {step === 2 && "A photo helps others recognize you."}
            {step === 3 && "Select categories you're interested in."}
            {step === 4 && "Follow top creators to see their content in your feed."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Name + Username */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display name *</Label>
                <Input
                  id="display_name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, underscores, hyphens only.
                </p>
              </div>
            </>
          )}

          {/* Step 2: Avatar */}
          {step === 2 && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-24 w-24 rounded-full bg-muted overflow-hidden border-2 border-border">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {avatarFile ? "Change photo" : "Upload photo"}
                </div>
              </label>
              {avatarFile && (
                <p className="text-xs text-muted-foreground">{avatarFile.name}</p>
              )}
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm transition-all ${
                    selectedCategories.includes(cat.id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/50 bg-card hover:border-border text-muted-foreground"
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                  {selectedCategories.includes(cat.id) && (
                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Follow Creators */}
          {step === 4 && (
            <div className="space-y-2">
              {topCreators.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No creators to follow yet. You&apos;ll be among the first!
                </p>
              ) : (
                topCreators.map((creator) => (
                  <button
                    key={creator.id}
                    onClick={() => toggleCreator(creator.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-all ${
                      followedCreators.includes(creator.id)
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-border"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {creator.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={creator.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-medium truncate">{creator.display_name || creator.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {creator.post_count} upload{creator.post_count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {followedCreators.includes(creator.id) ? (
                      <CheckCircle2 className="h-5 w-5 text-primary ml-auto flex-shrink-0" />
                    ) : (
                      <div className="ml-auto text-xs text-muted-foreground">Follow</div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={loading}
              className="text-muted-foreground"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
            <Button onClick={handleNext} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {step === totalSteps ? "Get Started" : "Continue"}
              {step < totalSteps && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

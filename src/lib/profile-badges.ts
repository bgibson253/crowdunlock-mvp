export type ProfileBadge = {
  unlock_tier_label: string | null;
  unlock_tier_icon: string | null;
};

export async function fetchProfileBadge(
  supabase: any,
  userId: string,
): Promise<ProfileBadge | null> {
  const { data, error } = await supabase
    .from("profile_badges")
    .select("unlock_tier_label,unlock_tier_icon")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return (data as any) ?? null;
}

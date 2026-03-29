import { redirect, notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfileLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u: username } = await searchParams;
  if (!username) return notFound();

  const supabase = await supabaseServer();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return notFound();

  redirect(`/profile/${profile.id}`);
}

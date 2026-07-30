import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AgentDashboard from "./agent-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent Dashboard",
  robots: { index: false, follow: false },
};

export default async function AgentPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/browse");

  return <AgentDashboard />;
}

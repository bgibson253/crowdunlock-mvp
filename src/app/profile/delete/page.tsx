import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { DeleteAccountForm } from "@/components/profile/delete-account-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Delete Account" };

export default async function DeleteAccountPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth?redirect=%2Fprofile%2Fdelete");
  }

  return (
    <div className="relative isolate min-h-[80vh] flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Delete Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We're sorry to see you go.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-8 shadow-2xl">
          <DeleteAccountForm userId={data.user.id} email={data.user.email ?? ""} />
        </div>
      </div>
    </div>
  );
}

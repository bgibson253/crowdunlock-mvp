import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { UploadDraftForm } from "@/components/upload/upload-draft-form";

export default async function UploadPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">New upload</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Test mode: <span className="font-medium text-foreground">free + instant</span>. No payments.
      </p>
      <div className="mt-8">
        <UploadDraftForm />
      </div>
    </main>
  );
}

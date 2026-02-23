import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isTestMode } from "@/lib/env";
import { UploadDraftForm } from "@/components/upload/upload-draft-form";

export default async function UploadPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const testMode = isTestMode();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">New upload</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {testMode ? (
          <>
            Test mode: <span className="font-medium text-foreground">free + instant</span>. No payments.
          </>
        ) : (
          <>
            You’ll pay a <span className="font-medium text-foreground">refundable $2</span> posting fee first.
          </>
        )}
      </p>
      <div className="mt-8">
        <UploadDraftForm />
      </div>
    </main>
  );
}

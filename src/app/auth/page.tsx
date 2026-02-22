import { MagicLinkForm } from "@/components/auth/magic-link-form";

export default function AuthPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Get a magic link via email. No password.
      </p>
      <div className="mt-6">
        <MagicLinkForm />
      </div>
    </main>
  );
}

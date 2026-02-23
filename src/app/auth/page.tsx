import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Email + password (classic) or continue with Google, Apple, or Facebook.
      </p>
      <div className="mt-6">
        <AuthForm />
      </div>
    </main>
  );
}

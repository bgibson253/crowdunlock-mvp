"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { supabaseBrowser } from "@/lib/supabase/client";
import { envClient } from "@/lib/env";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsernameField } from "@/components/auth/username-field";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInValues = z.infer<typeof signInSchema>;

const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6),
    username: z.string().min(2, "Username required").max(24, "Max 24 chars").optional(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export function AuthForm({ requireUsername }: { requireUsername?: boolean } = {}) {
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const signIn = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUp = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirm: "", username: "" },
  });

  async function onPasswordSignIn(values: SignInValues) {
    setError(null);
    setNotice(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    window.location.assign("/browse");
  }

  async function onPasswordSignUp(values: SignUpValues) {
    setError(null);
    setNotice(null);

    const supabase = supabaseBrowser();
    const env = envClient();

    const { error, data } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.username?.trim() || undefined,
        },
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setNotice("Account created. Check your email to confirm, then sign in.");
  }

  async function onOAuth(provider: "google" | "apple" | "facebook") {
    setError(null);
    setNotice(null);

    const supabase = supabaseBrowser();
    const env = envClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) setError(error.message);
  }

  async function onResetPassword() {
    setError(null);
    setNotice(null);

    const email = signIn.getValues("email") || signUp.getValues("email");
    if (!email) {
      setError("Enter your email first (in either tab), then click reset.");
      return;
    }

    const supabase = supabaseBrowser();
    const env = envClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/reset`,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setNotice("Password reset email sent (if the account exists). Check your inbox.");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Button variant="outline" onClick={() => onOAuth("google")}>
          Continue with Google
        </Button>
        <Button variant="outline" onClick={() => onOAuth("apple")}>
          Continue with Apple
        </Button>
        <Button variant="outline" onClick={() => onOAuth("facebook")}>
          Continue with Facebook
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {notice ? (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">{notice}</div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="mt-4">
          <Form {...signIn}>
            <form onSubmit={signIn.handleSubmit(onPasswordSignIn)} className="space-y-4">
              <FormField
                control={signIn.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@domain.com" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signIn.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={signIn.formState.isSubmitting}>
                Sign in
              </Button>

              <Button type="button" variant="link" className="w-full" onClick={onResetPassword}>
                Forgot password?
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="signup" className="mt-4">
          <Form {...signUp}>
            <form onSubmit={signUp.handleSubmit(onPasswordSignUp)} className="space-y-4">
              {requireUsername ? (
                <FormField
                  control={signUp.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" autoComplete="nickname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <FormField
                control={signUp.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@domain.com" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signUp.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signUp.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={signUp.formState.isSubmitting}>
                Create account
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

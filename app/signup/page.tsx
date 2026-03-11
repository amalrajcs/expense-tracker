"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(8, "Minimum 8 characters"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const t = toast.loading("Creating account…");

    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      toast.dismiss(t);
      setSubmitting(false);

      if (error) {
        console.error("Supabase Signup Error:", error);
        return toast.error(error.message);
      }

      toast.success("Account created");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.dismiss(t);
      setSubmitting(false);
      console.error("Signup Catch Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to fetch");
    }
  }

  return (
    <AppShell showAuthActions>
      <div className="mx-auto w-full max-w-md">
        <div className="glass rounded-3xl p-7 md:p-8">
          <h1 className="font-display text-3xl leading-tight">Create account</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Your data stays private with Supabase row-level security.
          </p>

          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <label className="text-xs text-[color:var(--muted-2)]">Email</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@domain.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <div className="mt-1 text-xs text-[color:var(--expense)]">
                  {form.formState.errors.email.message}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-[color:var(--muted-2)]">Password</label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <div className="mt-1 text-xs text-[color:var(--expense)]">
                  {form.formState.errors.password.message}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-[color:var(--muted-2)]">Confirm password</label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <div className="mt-1 text-xs text-[color:var(--expense)]">
                  {form.formState.errors.confirmPassword.message}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Creating…" : "Create account"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-[color:var(--muted)]">
            Already have an account?{" "}
            <Link className="text-[color:var(--accent)] hover:underline" href="/login">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


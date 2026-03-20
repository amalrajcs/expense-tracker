"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const t = toast.loading("Creating your secure vault…");
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      toast.dismiss(t);
      setSubmitting(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome aboard!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.dismiss(t);
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  }

  const bgSymbols = useMemo(() => {
    if (!mounted) return [];
    const symbols = ["₹", "$", "€", "£", "¥", "₿", "₩", "₽", "₪"];
    return Array.from({ length: 12 }).map((_, i) => ({
      symbol: symbols[i % symbols.length],
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 12 + Math.random() * 20,
      opacity: 0.03 + Math.random() * 0.07,
      duration: 18 + Math.random() * 22,
      delay: Math.random() * -25,
    }));
  }, [mounted]);

  return (
    <AppShell showAuthActions={false}>
      <div className="relative flex min-h-[calc(100vh-100px)] items-center justify-center p-4">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-[#04060f]" />
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {bgSymbols.map((item, i) => (
            <div
              key={i}
              className="absolute font-display select-none pointer-events-none"
              style={{
                top: `${item.top}%`, left: `${item.left}%`,
                fontSize: `${item.size}px`, opacity: item.opacity,
                animation: `drift ${item.duration}s linear infinite`,
                animationDelay: `${item.delay}s`,
              }}
            >
              {item.symbol}
            </div>
          ))}
          <div className="absolute bottom-1/3 left-1/4 h-[500px] w-[500px] rounded-full opacity-12"
            style={{ background: "radial-gradient(circle, #f43f5e, transparent 65%)", filter: "blur(100px)" }} />
          <div className="absolute top-1/2 right-1/3 h-[500px] w-[500px] rounded-full opacity-12"
            style={{ background: "radial-gradient(circle, #6366f1, transparent 65%)", filter: "blur(100px)" }} />
        </div>

        {/* Card */}
        <div className="w-full max-w-[460px] animate-fade-in-scale">
          <div
            className="relative overflow-hidden rounded-[32px] p-8 md:p-10"
            style={{
              background: "rgba(10,14,28,0.80)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Top shimmer line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            {/* Header */}
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px w-6 bg-cyan-400" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">Fino · Create Account</span>
              </div>
              <h1 className="font-display text-[2.6rem] leading-tight text-white">
                Get started.
              </h1>
              <p className="mt-2 text-sm" style={{ color: "rgba(160,175,215,0.5)" }}>
                Join thousands managing money with clarity.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(160,175,215,0.45)" }}>
                  Email
                </label>
                <Input
                  type="email"
                  className="h-13 rounded-xl border-white/[0.07] bg-white/[0.04] px-5 text-sm text-white placeholder:text-white/20 transition-all focus:border-cyan-500/40 focus:bg-white/[0.07] focus:ring-0"
                  placeholder="name@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(160,175,215,0.45)" }}>
                    Password
                  </label>
                  <Input
                    type="password"
                    className="h-13 rounded-xl border-white/[0.07] bg-white/[0.04] px-5 text-sm text-white placeholder:text-white/20 transition-all focus:border-cyan-500/40 focus:bg-white/[0.07] focus:ring-0"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-rose-400">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(160,175,215,0.45)" }}>
                    Confirm
                  </label>
                  <Input
                    type="password"
                    className="h-13 rounded-xl border-white/[0.07] bg-white/[0.04] px-5 text-sm text-white placeholder:text-white/20 transition-all focus:border-cyan-500/40 focus:bg-white/[0.07] focus:ring-0"
                    placeholder="••••••••"
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-rose-400">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Password strength hint */}
              <p className="text-[10px]" style={{ color: "rgba(160,175,215,0.35)" }}>
                Use 8+ characters with a mix of letters and numbers.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="group relative mt-2 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #6366f1)",
                  boxShadow: "0 8px 32px rgba(6,182,212,0.4)",
                }}
              >
                <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-10" />
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account…
                  </>
                ) : (
                  "Create my account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "rgba(160,175,215,0.3)" }}>Have an account?</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/[0.07]"
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(200,210,240,0.7)",
              }}
            >
              Sign in instead →
            </Link>
          </div>
        </div>

        <style jsx>{`
          @keyframes drift {
            from { transform: translate(0,0) rotate(0deg); }
            50%  { transform: translate(50px,50px) rotate(180deg); }
            to   { transform: translate(0,0) rotate(360deg); }
          }
          .animate-fade-in-scale {
            animation: fadeInScale 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.96) translateY(16px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          .h-13 { height: 3.25rem; }
        `}</style>
      </div>
    </AppShell>
  );
}

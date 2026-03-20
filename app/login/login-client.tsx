"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get("next") || "/dashboard";
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const t = toast.loading("Verifying credentials…");
    try {
      const { error } = await supabase.auth.signInWithPassword(values);
      toast.dismiss(t);
      setSubmitting(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back to Fino");
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      toast.dismiss(t);
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : "Authentication failed");
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
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #6366f1, transparent 65%)", filter: "blur(100px)" }} />
          <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #06b6d4, transparent 65%)", filter: "blur(80px)" }} />
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px] animate-fade-in-scale">
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
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            {/* Header */}
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px w-6 bg-indigo-500" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">Fino · Sign In</span>
              </div>
              <h1 className="font-display text-[2.6rem] leading-tight text-white">
                Welcome back.
              </h1>
              <p className="mt-2 text-sm" style={{ color: "rgba(160,175,215,0.5)" }}>
                Continue to your financial dashboard.
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
                  className="h-13 rounded-xl border-white/[0.07] bg-white/[0.04] px-5 text-sm text-white placeholder:text-white/20 transition-all focus:border-indigo-500/50 focus:bg-white/[0.07] focus:ring-0"
                  placeholder="name@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(160,175,215,0.45)" }}>
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="h-13 rounded-xl border-white/[0.07] bg-white/[0.04] px-5 pr-12 text-sm text-white placeholder:text-white/20 transition-all focus:border-indigo-500/50 focus:bg-white/[0.07] focus:ring-0"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: "rgba(160,175,215,0.4)" }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-rose-400">{form.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group relative mt-2 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                  boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
                }}
              >
                <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-10" />
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  "Sign in to Fino"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "rgba(160,175,215,0.3)" }}>New here?</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            <Link
              href="/signup"
              className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/[0.07]"
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(200,210,240,0.7)",
              }}
            >
              Create a free account →
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

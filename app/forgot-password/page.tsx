"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const t = toast.loading("Sending reset link...");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      toast.dismiss(t);
      setSubmitting(false);

      if (error) {
        return toast.error(error.message);
      }

      setEmailSent(true);
      toast.success("Password reset link sent to your email.");
    } catch (err) {
      toast.dismiss(t);
      setSubmitting(false);
      console.error("Forgot Password Catch Error:", err instanceof Error ? err.message : err);
      toast.error(err instanceof Error ? err.message : "Failed to send reset link");
    }
  }

  const bgSymbols = useMemo(() => {
    if (!mounted) return [];
    const symbols = ["₹", "$", "€", "£", "¥", "₿", "₩", "₽", "₪"];
    return Array.from({ length: 15 }).map((_, i) => ({
      symbol: symbols[i % symbols.length],
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 14 + Math.random() * 24,
      opacity: 0.05 + Math.random() * 0.1,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -20,
    }));
  }, [mounted]);

  return (
    <AppShell showAuthActions={false}>
      <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        {/* Ambient Background */}
        <div className="fixed inset-0 -z-10 bg-black" />
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {bgSymbols.map((item, i) => (
            <div
              key={i}
              className="absolute font-display font-black select-none pointer-events-none"
              style={{
                top: `${item.top}%`,
                left: `${item.left}%`,
                fontSize: `${item.size}px`,
                opacity: item.opacity,
                animation: `drift ${item.duration}s linear infinite`,
                animationDelay: `${item.delay}s`,
              }}
            >
              {item.symbol}
            </div>
          ))}
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        <div className="w-full max-w-[440px] animate-fadeIn">
          <div className="glass group relative overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.03] p-10 backdrop-blur-3xl shadow-2xl">
            {/* Top Brand Symbol */}
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 rotate-[-6deg] items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-cyan-500 text-3xl font-black text-white shadow-xl shadow-indigo-500/25 transition-transform duration-500 group-hover:rotate-[6deg] group-hover:scale-110">
                ?
              </div>
            </div>

            <div className="text-center">
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Reset Password
              </h1>
              <p className="font-accent mt-3 text-base text-slate-400">
                {emailSent 
                  ? "Check your email for the reset link."
                  : "Enter your email to receive a reset link."
                }
              </p>
            </div>

            {!emailSent ? (
              <form className="mt-10 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Email Address</label>
                  <Input 
                    type="email" 
                    className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 text-base transition-all focus:border-indigo-500/50 focus:bg-white/10 focus:ring-0" 
                    placeholder="name@example.com" 
                    {...form.register("email")} 
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs font-medium text-rose-500 ml-2">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="mt-4 h-14 w-full rounded-2xl bg-linear-to-br from-indigo-600 to-cyan-600 text-base font-bold text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50" 
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="mt-10">
                <Button 
                  className="mt-4 h-14 w-full rounded-2xl bg-white/10 text-base font-bold text-white shadow-xl hover:bg-white/20 active:scale-[0.98] transition-all" 
                  onClick={() => router.push('/login')}
                >
                  Return to Login
                </Button>
              </div>
            )}

            <div className="mt-8 text-center text-sm font-medium text-slate-400">
              Remember your password?{" "}
              <Link className="text-indigo-400 transition-colors hover:text-indigo-300 font-bold" href="/login">
                Log in
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes drift {
            from { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(40px, 40px) rotate(180deg); }
            to { transform: translate(0, 0) rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        `}</style>
      </div>
    </AppShell>
  );
}

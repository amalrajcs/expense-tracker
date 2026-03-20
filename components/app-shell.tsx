"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  showAuthActions = false,
}: {
  children: React.ReactNode;
  showAuthActions?: boolean;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setEmail(data.user?.email ?? null);
    });
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function onLogout() {
    const t = toast.loading("Signing out…");
    const { error } = await supabase.auth.signOut();
    toast.dismiss(t);
    if (error) return toast.error(error.message);
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      {/* Glassmorphism Navbar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 transition-all duration-500",
        )}
      >
        <header
          className={cn(
            "w-full max-w-6xl rounded-2xl border transition-all duration-500",
            scrolled
              ? "border-white/10 bg-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(99,102,241,0.12)] backdrop-blur-2xl"
              : "border-white/[0.06] bg-white/[0.03] backdrop-blur-xl"
          )}
        >
          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="flex h-[62px] items-center justify-between px-5">
            <Brand />

            <nav className="flex items-center gap-2">
              {showAuthActions ? (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => router.push("/signup")}
                    className="relative rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                      boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
                    }}
                  >
                    Get started
                  </button>
                </>
              ) : email ? (
                <>
                  <div className="hidden max-w-[200px] truncate rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/50 sm:block">
                    {email}
                  </div>
                  <button
                    onClick={onLogout}
                    className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div
                  className={cn(
                    "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/40",
                    pathname?.startsWith("/dashboard") && "animate-pulse",
                  )}
                >
                  {pathname?.startsWith("/dashboard") ? "Loading session…" : "—"}
                </div>
              )}
            </nav>
          </div>
        </header>
      </div>

      {/* Page content — padded for fixed navbar */}
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-[90px]">{children}</main>
    </div>
  );
}

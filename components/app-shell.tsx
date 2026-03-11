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

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setEmail(data.user?.email ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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
      <div className="pointer-events-none fixed inset-0 opacity-60 [mask-image:radial-gradient(400px_240px_at_20%_15%,black,transparent_70%)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(43,92,255,0.18),transparent,rgba(43,92,255,0.10))]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[color:var(--bg)]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Brand />
            <div className="hidden text-xs text-[color:var(--muted-2)] md:block">
              Income + expenses, with clarity.
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showAuthActions ? (
              <>
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Log in
                </Button>
                <Button onClick={() => router.push("/signup")}>Create account</Button>
              </>
            ) : email ? (
              <>
                <div className="hidden max-w-[260px] truncate rounded-full border border-white/10 bg-white/40 px-3 py-1 text-xs text-[color:var(--muted)] dark:bg-white/10 sm:block">
                  {email}
                </div>
                <Button variant="secondary" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <div
                className={cn(
                  "rounded-full border border-white/10 bg-white/40 px-3 py-1 text-xs text-[color:var(--muted-2)] dark:bg-white/10",
                  pathname?.startsWith("/dashboard") && "animate-pulse",
                )}
              >
                {pathname?.startsWith("/dashboard") ? "Loading session…" : "—"}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}


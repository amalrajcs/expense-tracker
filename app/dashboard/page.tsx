import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <AppShell>
        <div className="glass mx-auto max-w-2xl rounded-3xl p-7 md:p-8">
          <h1 className="font-display text-3xl leading-tight">Setup required</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Add <span className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
            <span className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to{" "}
            <span className="font-mono text-xs">.env</span>, then restart the dev server.
          </p>
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            SQL schema is in <span className="font-mono text-xs">supabase/schema.sql</span>.
          </p>
        </div>
      </AppShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppShell>
      <DashboardClient userId={user.id} />
    </AppShell>
  );
}


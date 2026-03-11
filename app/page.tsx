import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <AppShell showAuthActions>
      <section className="relative overflow-hidden">
        <div className="glass relative rounded-3xl p-8 md:p-12">
          <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[color:var(--accent)]/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-14 h-72 w-72 rounded-full bg-[color:var(--accent-2)]/12 blur-3xl" />

          <div className="relative grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/40 px-3 py-1 text-xs text-[color:var(--muted)] dark:bg-white/10">
                <span className="font-mono text-[10px] tracking-wider">NEXT • SUPABASE • CHARTS</span>
              </div>
              <h1 className="font-display mt-5 text-4xl leading-[1.03] tracking-tight md:text-6xl">
                Money, distilled into calm decisions.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[color:var(--muted)] md:text-base md:leading-7">
                Log income and expenses, categorize spending, and see your month at a glance—net balance,
                savings rate, and trends that actually explain what changed.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Log in
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm md:grid-cols-3">
                <Feature title="Fast logging" body="Slide-out panel. Keyboard-friendly." />
                <Feature title="Clarity by default" body="Green income. Red expenses. Dense table." />
                <Feature title="Charts that answer" body="Category, monthly, and 6‑month trend." />
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-black/5 p-5 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[color:var(--muted-2)]">This month</div>
                  <div className="font-mono text-xs text-[color:var(--muted-2)]">03 • 2026</div>
                </div>
                <div className="mt-4 grid gap-3">
                  <MiniStat label="Income" value="$6,200" tone="income" />
                  <MiniStat label="Expenses" value="$2,845" tone="expense" />
                  <MiniStat label="Net" value="$3,355" tone="accent" />
                </div>
                <div className="mt-5 h-20 rounded-2xl border border-white/10 bg-gradient-to-r from-[color:var(--accent)]/20 via-transparent to-[color:var(--accent-2)]/20" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/40 p-4 text-sm dark:bg-white/10">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs leading-5 text-[color:var(--muted-2)]">{body}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "accent";
}) {
  const color =
    tone === "income"
      ? "var(--income)"
      : tone === "expense"
        ? "var(--expense)"
        : "var(--accent)";
  return (
    <div className="flex items-baseline justify-between rounded-2xl border border-white/10 bg-white/35 px-4 py-3 dark:bg-white/10">
      <div className="text-xs text-[color:var(--muted-2)]">{label}</div>
      <div className="font-display text-2xl leading-none" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-[color:var(--accent)] text-white shadow-[0_12px_34px_rgba(43,92,255,0.22)]">
        <span className="font-display text-lg leading-none">E</span>
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg tracking-tight">Expense</div>
        <div className="-mt-0.5 text-xs text-[color:var(--muted-2)]">Tracker</div>
      </div>
    </div>
  );
}


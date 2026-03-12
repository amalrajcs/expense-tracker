"use client";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 rotate-[-6deg] items-center justify-center rounded-xl bg-linear-to-br from-[color:var(--primary)] to-[color:var(--secondary)] font-display text-xl font-extrabold text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 hover:rotate-[6deg] hover:scale-110">
        ₹
      </div>
      <div className="flex flex-col gap-0">
        <div className="font-display text-xl font-extrabold tracking-tight leading-none text-[color:var(--fg)]">
          Finio
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--muted-2)]">
          Expense Tracker
        </div>
      </div>
    </div>
  );
}


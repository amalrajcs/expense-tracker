"use client";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Wordmark */}
      <div className="flex flex-col gap-0 leading-none">
        <span
          className="font-display text-2xl tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Fino
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "rgba(160,175,215,0.45)" }}
        >
          Expense Tracker
        </span>
      </div>
    </div>
  );
}

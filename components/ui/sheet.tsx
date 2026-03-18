"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onMouseDown={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "relative flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--bg)] shadow-2xl transition-all duration-300",
          "dark:bg-[color:var(--bg)]",
          open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-5">
          <div className="min-w-0">
            <div className="font-display text-xl font-semibold tracking-tight">{title}</div>
            <div className="mt-1.5 text-xs text-[color:var(--muted-2)]">Press Esc to close</div>
          </div>
          <button
            className="rounded-lg p-2 text-[color:var(--muted)] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">{children}</div>
      </aside>
    </div>
  );
}


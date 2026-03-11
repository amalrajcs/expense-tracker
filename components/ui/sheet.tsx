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
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onMouseDown={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-[520px] translate-x-full border-l border-white/10 bg-[color:var(--bg)] shadow-2xl transition-transform",
          "dark:bg-[color:var(--bg)]",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="min-w-0">
            <div className="font-display text-xl leading-none">{title}</div>
            <div className="mt-1 text-xs text-[color:var(--muted-2)]">Press Esc to close</div>
          </div>
          <button
            className="rounded-lg p-2 text-[color:var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-auto px-6 pb-10">{children}</div>
      </aside>
    </div>
  );
}


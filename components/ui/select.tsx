"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full appearance-none rounded-xl border border-[color:var(--card-border)] bg-white/60 px-3 pr-8 text-sm text-[color:var(--fg)] shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        "dark:bg-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}


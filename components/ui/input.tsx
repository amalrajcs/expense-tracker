"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[color:var(--card-border)] bg-white/60 px-3 text-sm text-[color:var(--fg)] shadow-sm",
        "placeholder:text-[color:var(--muted-2)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        "dark:bg-white/10",
        className,
      )}
      {...props}
    />
  );
}


"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4",
        size === "lg" && "h-11 px-5 text-base",
        variant === "primary" &&
          "border-transparent bg-[color:var(--accent)] text-white shadow-[0_10px_30px_rgba(43,92,255,0.22)] hover:brightness-[1.05] active:brightness-95",
        variant === "secondary" &&
          "border-[color:var(--card-border)] bg-white/60 text-[color:var(--fg)] hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/14",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[color:var(--fg)] hover:bg-black/5 dark:hover:bg-white/8",
        variant === "danger" &&
          "border-transparent bg-[color:var(--expense)] text-white hover:brightness-[1.03] active:brightness-95",
        className,
      )}
      {...props}
    />
  );
}


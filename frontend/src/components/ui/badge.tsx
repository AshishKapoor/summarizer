import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "muted";
}

export function Badge({
  className,
  variant = "primary",
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-tight";
  const variants = {
    primary: "bg-slate-900 text-slate-50",
    muted: "bg-slate-100 text-slate-600",
  };
  return <span className={cn(base, variants[variant], className)} {...props} />;
}

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "online" | "busy" | "offline" | "warning";

const colors: Record<Variant, string> = {
  online: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]",
  busy: "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.7)]",
  offline: "bg-zinc-500",
  warning: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]",
};

export function LiveDot({
  variant = "online",
  className,
  pulse = true,
}: {
  variant?: Variant;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-2 w-2 rounded-full",
        colors[variant],
        pulse && "animate-pulse-dot",
        className,
      )}
    />
  );
}

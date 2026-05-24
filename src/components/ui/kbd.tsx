import * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-white/[0.08] bg-white/[0.04] px-1.5 font-mono text-[10px] font-medium text-foreground/70",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

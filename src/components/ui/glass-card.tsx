import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  hairline?: boolean;
  hover?: boolean;
};

export function GlassCard({
  className,
  hairline = false,
  hover = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        hairline && "hairline",
        hover &&
          "transition-all duration-300 hover:bg-white/[0.035] hover:border-white/[0.10]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-5 border-b border-white/[0.05]",
        className,
      )}
      {...props}
    />
  );
}

export function GlassCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-mono text-sm font-medium tracking-wider uppercase text-foreground/80",
        className,
      )}
      {...props}
    />
  );
}

export function GlassCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

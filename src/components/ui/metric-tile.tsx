"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { GlassCard } from "./glass-card";

type MetricTileProps = {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
  sparkline?: number[];
  className?: string;
};

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-10 w-24"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.18 175)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="oklch(0.78 0.18 175)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="oklch(0.78 0.18 175)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#sparkGrad)"
      />
    </svg>
  );
}

export function MetricTile({
  label,
  value,
  delta,
  hint,
  icon,
  sparkline,
  className,
}: MetricTileProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
            {icon}
            {label}
          </div>
          <div className="font-mono text-3xl font-semibold tabular-nums">
            {value}
          </div>
          {hint && (
            <div className="text-xs text-muted-foreground font-mono">
              {hint}
            </div>
          )}
        </div>
        {sparkline && <Sparkline data={sparkline} />}
      </div>
      {typeof delta === "number" && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px]",
            positive
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-300",
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {positive ? "+" : ""}
          {delta.toFixed(1)}%
        </div>
      )}
    </GlassCard>
  );
}

"use client";

import { Building2, Calendar, BadgeCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCount } from "../../AnimatedCount";
import type { ProfileModuleProps } from "../types";

export function OwnerPresenceTiles({ data }: ProfileModuleProps) {
  const approvedCount = data.stadiums.filter((s) => s.approved).length;
  const pendingCount = data.stadiums.filter((s) => !s.approved).length;

  const tiles = [
    {
      label: "stades gérés",
      value: data.stadiums.length,
      icon: <Building2 className="h-3 w-3" />,
      hint: pendingCount > 0 ? `${pendingCount} en attente` : "tous actifs",
      href: "/owner/stadiums",
    },
    {
      label: "réservations",
      value: data.ownerBookingsTotal,
      icon: <Calendar className="h-3 w-3" />,
      hint: "reçues au total",
      href: "/owner/reservations",
    },
    {
      label: "stades approuvés",
      value: approvedCount,
      icon: <BadgeCheck className="h-3 w-3" />,
      hint: data.stadiums.length > 0 ? `sur ${data.stadiums.length}` : "aucun stade",
      href: "/owner/stadiums",
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => (
        <a key={t.label} href={t.href}>
          <GlassCard hover className="p-5 cursor-pointer">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 flex items-center gap-1.5">
              {t.icon}
              {t.label}
            </div>
            <div className="font-mono text-3xl font-semibold tabular-nums">
              <AnimatedCount to={t.value} />
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">{t.hint}</div>
          </GlassCard>
        </a>
      ))}
    </div>
  );
}

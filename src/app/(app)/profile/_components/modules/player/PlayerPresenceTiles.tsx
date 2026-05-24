"use client";

import { Calendar, Users, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCount } from "../../AnimatedCount";
import type { ProfileModuleProps } from "../types";

export function PlayerPresenceTiles({ data }: ProfileModuleProps) {
  const tiles = [
    {
      label: "réservations",
      value: data.confirmedBookingsCount,
      icon: <Calendar className="h-3 w-3" />,
      hint: "confirmées",
      href: "/bookings",
    },
    {
      label: "équipes",
      value: data.teamsCount,
      icon: <Users className="h-3 w-3" />,
      hint: data.isCaptain ? "dont capitaine" : "rejointes",
      href: "/teams",
    },
    {
      label: "événements",
      value: data.eventsCount,
      icon: <Trophy className="h-3 w-3" />,
      hint: "participations",
      href: "/events",
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
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
              {t.hint}
            </div>
          </GlassCard>
        </a>
      ))}
    </div>
  );
}

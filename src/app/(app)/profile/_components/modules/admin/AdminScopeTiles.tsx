"use client";

import { Users, Ticket, Flag } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCount } from "../../AnimatedCount";
import type { ProfileModuleProps } from "../types";

export function AdminScopeTiles({ data }: ProfileModuleProps) {
  const tiles = [
    {
      label: "utilisateurs",
      value: data.usersCount,
      icon: <Users className="h-3 w-3" />,
      hint: "inscrits",
      href: "/admin/users",
    },
    {
      label: "tickets ouverts",
      value: data.openTicketsCount,
      icon: <Ticket className="h-3 w-3" />,
      hint: data.highPriorityTickets.length > 0
        ? `${data.highPriorityTickets.length} priorité haute`
        : "aucune urgence",
      href: "/admin/tickets",
      alert: data.openTicketsCount > 0,
    },
    {
      label: "signalements",
      value: data.flaggedPostsCount,
      icon: <Flag className="h-3 w-3" />,
      hint: "publications à traiter",
      href: "/admin/moderation",
      alert: data.flaggedPostsCount > 0,
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => (
        <a key={t.label} href={t.href}>
          <GlassCard
            hover
            className={`p-5 cursor-pointer ${
              (t as { alert?: boolean }).alert
                ? "border-rose-500/20"
                : ""
            }`}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 flex items-center gap-1.5">
              {t.icon}
              {t.label}
            </div>
            <div
              className={`font-mono text-3xl font-semibold tabular-nums ${
                (t as { alert?: boolean }).alert ? "text-rose-300" : ""
              }`}
            >
              <AnimatedCount to={t.value} />
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">{t.hint}</div>
          </GlassCard>
        </a>
      ))}
    </div>
  );
}

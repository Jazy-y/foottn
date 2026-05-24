"use client";

import Link from "next/link";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyPresence } from "../../EmptyPresence";
import type { ProfileModuleProps } from "../types";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "text-emerald-300",
  COMPLETED: "text-sky-300",
  PENDING: "text-amber-300",
  CANCELLED: "text-rose-300",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "confirmée",
  COMPLETED: "terminée",
  PENDING: "en attente",
  CANCELLED: "annulée",
};

export function PlayerRecentActivity({ data }: ProfileModuleProps) {
  const booking = data.lastBooking;
  const team = data.lastTeam;

  return (
    <GlassCard className="p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
        activité récente
      </div>

      {!booking && !team ? (
        <EmptyPresence
          icon={<Calendar className="h-4 w-4" />}
          label="aucune activité"
          hint="Réservez un terrain ou rejoignez une équipe pour commencer"
          cta={{ label: "Explorer les stades", href: "/stadiums" }}
        />
      ) : (
        <div className="space-y-4">
          {/* Last booking */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              dernière réservation
            </div>
            {booking ? (
              <Link
                href="/bookings"
                className="group flex items-start justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.035]"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-medium truncate">
                    {booking.stadiumName ?? "Stade"}
                  </div>
                  {toDate(booking.startTime) && (
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {format(toDate(booking.startTime)!, "EEEE d MMM · HH'h'mm", { locale: fr })}
                    </div>
                  )}
                  <div className={`mt-1 font-mono text-[10px] uppercase tracking-wider ${STATUS_STYLE[booking.status] ?? "text-muted-foreground"}`}>
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <p className="font-mono text-[11px] text-muted-foreground">Aucune réservation</p>
            )}
          </div>

          {/* Last team */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              dernière équipe
            </div>
            {team ? (
              <Link
                href="/teams"
                className="group flex items-start justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.035]"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-medium truncate">
                    {team.name}
                    {team.tag && (
                      <span className="ml-2 text-[10px] text-muted-foreground">[{team.tag}]</span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {team.memberIds.length} membre{team.memberIds.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <p className="font-mono text-[11px] text-muted-foreground">Aucune équipe</p>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

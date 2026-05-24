"use client";

import { CheckCircle2, Circle, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import type { ProfileModuleProps } from "../types";

export function OwnerTrustCard({ appUser, data }: ProfileModuleProps) {
  const hasApprovedStadium = data.stadiums.some((s) => s.approved);
  const hasReceivedBookings = data.ownerBookingsTotal > 0;

  const avgRating =
    data.stadiums.length > 0
      ? data.stadiums.reduce((sum, s) => sum + (s.rating ?? 0), 0) / data.stadiums.length
      : null;

  const signals = [
    { label: "identité vérifiée", checked: true },
    { label: "email confirmé", checked: data.emailVerified },
    { label: "stade approuvé", checked: hasApprovedStadium },
    { label: "premières réservations reçues", checked: hasReceivedBookings },
    { label: "profil complété", checked: (appUser.bio?.length ?? 0) > 10 },
  ];

  return (
    <GlassCard className="p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
        confiance propriétaire
      </div>

      <div className="space-y-2.5 mb-5">
        {signals.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            {s.checked ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-white/20" />
            )}
            <span
              className={`font-mono text-xs ${
                s.checked ? "text-foreground/80" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {avgRating !== null && avgRating > 0 && (
        <div className="border-t border-white/[0.06] pt-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            note moyenne des stades
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-mono text-lg font-semibold tabular-nums">
              {avgRating.toFixed(1)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">/ 5</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

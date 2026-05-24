"use client";

import Link from "next/link";
import { Building2, CheckCircle2, Clock, Plus, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyPresence } from "../../EmptyPresence";
import type { ProfileModuleProps } from "../types";

export function OwnerStadiumPortfolio({ data }: ProfileModuleProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          mes stades
        </div>
        <Link
          href="/owner/stadiums"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          tout voir →
        </Link>
      </div>

      {data.stadiums.length === 0 ? (
        <EmptyPresence
          icon={<Building2 className="h-4 w-4" />}
          label="aucun stade enregistré"
          hint="Ajoutez votre premier terrain pour commencer à recevoir des réservations"
          cta={{ label: "Créer un stade", href: "/owner/stadiums" }}
        />
      ) : (
        <div className="space-y-2">
          {data.stadiums.slice(0, 4).map((stadium) => (
            <Link
              key={stadium.id}
              href={`/owner/stadiums`}
              className="group flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.035]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium truncate">{stadium.name}</span>
                  {stadium.approved ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-300">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      approuvé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase text-amber-300">
                      <Clock className="h-2.5 w-2.5" />
                      en attente
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {stadium.pricePerHour} TND/h · {stadium.location}
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}

          {/* Add stadium shortcut */}
          <Link
            href="/owner/stadiums"
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.08] py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            ajouter un stade
          </Link>
        </div>
      )}
    </GlassCard>
  );
}

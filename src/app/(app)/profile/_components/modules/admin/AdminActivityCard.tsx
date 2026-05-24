"use client";

import Link from "next/link";
import { Building2, Flag, Ticket, ArrowRight, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyPresence } from "../../EmptyPresence";
import type { ProfileModuleProps } from "../types";

export function AdminActivityCard({ data }: ProfileModuleProps) {
  const hasPendingItems =
    data.pendingStadiums.length > 0 ||
    data.flaggedPostsCount > 0 ||
    data.highPriorityTickets.length > 0;

  return (
    <GlassCard className="p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
        actions requises
      </div>

      {!hasPendingItems ? (
        <EmptyPresence
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="aucune action requise"
          hint="La plateforme est à jour — aucun élément en attente"
        />
      ) : (
        <div className="space-y-3">
          {/* Pending stadium approvals */}
          {data.pendingStadiums.length > 0 && (
            <Link
              href="/admin/stadiums"
              className="group flex items-center justify-between gap-3 rounded-lg border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3 transition-colors hover:bg-amber-500/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <div className="min-w-0">
                  <div className="font-mono text-xs font-medium text-amber-300">
                    {data.pendingStadiums.length} stade{data.pendingStadiums.length !== 1 ? "s" : ""} en attente
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    {data.pendingStadiums.slice(0, 2).map((s) => s.name).join(", ")}
                    {data.pendingStadiums.length > 2 && ` +${data.pendingStadiums.length - 2}`}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* Flagged posts */}
          {data.flaggedPostsCount > 0 && (
            <Link
              href="/admin/moderation"
              className="group flex items-center justify-between gap-3 rounded-lg border border-rose-500/15 bg-rose-500/[0.05] px-4 py-3 transition-colors hover:bg-rose-500/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Flag className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                <div>
                  <div className="font-mono text-xs font-medium text-rose-300">
                    {data.flaggedPostsCount} publication{data.flaggedPostsCount !== 1 ? "s" : ""} signalée{data.flaggedPostsCount !== 1 ? "s" : ""}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    à modérer
                  </div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* High-priority tickets */}
          {data.highPriorityTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href="/admin/tickets"
              className="group flex items-center justify-between gap-3 rounded-lg border border-violet-500/15 bg-violet-500/[0.05] px-4 py-3 transition-colors hover:bg-violet-500/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Ticket className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <div className="min-w-0">
                  <div className="font-mono text-xs font-medium text-violet-300 truncate">
                    {ticket.subject}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    priorité haute
                  </div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

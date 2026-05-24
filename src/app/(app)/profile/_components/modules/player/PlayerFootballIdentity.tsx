"use client";

import Link from "next/link";
import { Pencil, UserCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyPresence } from "../../EmptyPresence";
import type { ProfileModuleProps } from "../types";

const POSITION_LABEL: Record<string, string> = {
  GK: "Gardien",
  DEF: "Défenseur",
  MID: "Milieu",
  FWD: "Attaquant",
  ANY: "Polyvalent",
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: "text-slate-300 border-slate-500/20 bg-slate-500/10",
  INTERMEDIATE: "text-sky-300 border-sky-500/20 bg-sky-500/10",
  ADVANCED: "text-violet-300 border-violet-500/20 bg-violet-500/10",
  PRO: "text-amber-300 border-amber-500/20 bg-amber-500/10",
};

export function PlayerFootballIdentity({ appUser }: ProfileModuleProps) {
  const hasIdentity = !!(appUser.position || appUser.skillLevel);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          identité football
        </div>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="h-2.5 w-2.5" />
          modifier
        </Link>
      </div>

      {!hasIdentity ? (
        <EmptyPresence
          icon={<UserCheck className="h-4 w-4" />}
          label="identité non définie"
          hint="Indiquez votre position et niveau pour être trouvé plus facilement"
          cta={{ label: "Compléter le profil", href: "/profile/edit" }}
        />
      ) : (
        <div className="space-y-4">
          {appUser.position && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                position
              </div>
              <div className="font-mono text-lg font-medium text-foreground/90">
                {POSITION_LABEL[appUser.position] ?? appUser.position}
              </div>
            </div>
          )}

          {appUser.skillLevel && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                niveau
              </div>
              <span
                className={`inline-block rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider ${
                  LEVEL_COLOR[appUser.skillLevel] ?? "text-foreground border-white/10 bg-white/5"
                }`}
              >
                {appUser.skillLevel}
              </span>
            </div>
          )}

          {appUser.bio && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                style de jeu
              </div>
              <p className="text-sm text-foreground/70 line-clamp-3">{appUser.bio}</p>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

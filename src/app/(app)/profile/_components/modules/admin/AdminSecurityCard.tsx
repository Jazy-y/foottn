"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { GlassCard } from "@/components/ui/glass-card";
import type { ProfileModuleProps } from "../types";

export function AdminSecurityCard({ appUser, data }: ProfileModuleProps) {
  let lastLogin: string | null = null;
  if (data.lastSignInTime) {
    try {
      const d = new Date(data.lastSignInTime);
      if (isValid(d)) lastLogin = formatDistanceToNow(d, { addSuffix: true, locale: fr });
    } catch { /* skip */ }
  }

  const hasFullName = (appUser.displayName?.split(" ").length ?? 0) >= 2;
  const hasPhoto = !!appUser.photoURL;

  const signals = [
    { label: "email confirmé", checked: data.emailVerified },
    { label: "photo de profil", checked: hasPhoto },
    { label: "nom complet", checked: hasFullName },
    { label: "auth. à deux facteurs", checked: false, isHint: true },
  ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          sécurité du compte
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose-300">
          <ShieldAlert className="h-2.5 w-2.5" />
          critique
        </span>
      </div>

      <div className="space-y-2.5 mb-5">
        {signals.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            {s.checked ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-white/20" />
            )}
            <span className={`font-mono text-xs flex-1 ${s.checked ? "text-foreground/80" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {s.isHint && !s.checked && (
              <Link
                href="/settings"
                className="font-mono text-[10px] uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
              >
                configurer →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] pt-4 space-y-1.5">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          dernière connexion
        </div>
        <div className="font-mono text-sm text-foreground/80">
          {lastLogin ?? "—"}
        </div>
      </div>
    </GlassCard>
  );
}

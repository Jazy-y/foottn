"use client";

import Link from "next/link";
import { Wallet, Clock } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { GlassCard } from "@/components/ui/glass-card";
import type { User } from "@/types";
import type { ProfileData } from "./modules/types";

interface AccountFooterProps {
  appUser: User;
  data: ProfileData;
}

export function AccountFooter({ appUser, data }: AccountFooterProps) {
  const balance = appUser.walletBalance ?? 0;

  let lastLogin: string | null = null;
  if (data.lastSignInTime) {
    try {
      const d = new Date(data.lastSignInTime);
      if (isValid(d)) {
        lastLogin = formatDistanceToNow(d, { addSuffix: true, locale: fr });
      }
    } catch {
      // silently skip
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Wallet */}
      <Link href="/wallet">
        <GlassCard hover className="p-5 cursor-pointer">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Wallet className="h-3 w-3" />
                portefeuille
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {balance.toLocaleString("fr-TN", { minimumFractionDigits: 0 })}
                <span className="ml-1 text-sm font-normal text-muted-foreground">TND</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground mt-1">→</span>
          </div>
        </GlassCard>
      </Link>

      {/* Last login */}
      <GlassCard className="p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2 flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          dernière connexion
        </div>
        <div className="font-mono text-sm text-foreground/80">
          {lastLogin ?? "—"}
        </div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
          {appUser.email}
        </div>
      </GlassCard>
    </div>
  );
}

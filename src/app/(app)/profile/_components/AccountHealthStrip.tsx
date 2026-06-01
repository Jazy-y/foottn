"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import type { User } from "@/types";
import type { ProfileData } from "./modules/types";

interface HealthItem {
  label: string;
  checked: boolean;
  href: string;
}

function buildItems(appUser: User, data: ProfileData): HealthItem[] {
  const base: HealthItem[] = [
    {
      label: "email vérifié",
      checked: data.emailVerified,
      href: "/profile/edit",
    },
    {
      label: "photo définie",
      checked: !!appUser.photoURL,
      href: "/profile/edit",
    },
    {
      label: "bio complète",
      checked: (appUser.bio?.length ?? 0) > 10,
      href: "/profile/edit",
    },
  ];

  if (appUser.role === "PLAYER") {
    base.push(
      {
        label: "solde actif",
        checked: (appUser.walletBalance ?? 0) > 0,
        href: "/wallet",
      },
      {
        label: "position définie",
        checked: !!appUser.position && appUser.position !== "ANY",
        href: "/profile/edit",
      },
    );
  }

  if (appUser.role === "OWNER") {
    base.push({
      label: "stade créé",
      checked: data.stadiums.length > 0,
      href: "/owner/stadiums",
    });
  }

  if (appUser.role === "SUPER_ADMIN") {
    base.push({
      label: "nom complet",
      checked: (appUser.displayName?.split(" ").length ?? 0) >= 2,
      href: "/profile/edit",
    });
  }

  return base;
}

interface AccountHealthStripProps {
  appUser: User;
  data: ProfileData;
}

export function AccountHealthStrip({ appUser, data }: AccountHealthStripProps) {
  const items = buildItems(appUser, data);
  const done = items.filter((i) => i.checked).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <GlassCard className="px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Dots */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={item.href}
                title={item.checked ? "Complété" : "Cliquer pour compléter"}
                className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    item.checked
                      ? "bg-emerald-400 shadow-[0_0_4px_theme(colors.emerald.400)]"
                      : "bg-white/20 group-hover:bg-white/40"
                  }`}
                />
                {item.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-1 w-24 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {done}/{items.length}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

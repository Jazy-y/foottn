"use client";

import { motion } from "framer-motion";
import { Mail, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { LiveDot } from "@/components/ui/live-dot";
import type { User } from "@/types";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

const ROLE_CONFIG = {
  PLAYER: {
    label: "joueur",
    classes: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    dot: <LiveDot variant="online" />,
  },
  OWNER: {
    label: "propriétaire",
    classes: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    dot: <LiveDot variant="online" />,
  },
  SUPER_ADMIN: {
    label: "super admin",
    classes: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    dot: <Shield className="h-2.5 w-2.5" />,
  },
} as const;

interface ProfileHeaderProps {
  appUser: User;
}

export function ProfileHeader({ appUser }: ProfileHeaderProps) {
  const role = ROLE_CONFIG[appUser.role] ?? ROLE_CONFIG.PLAYER;
  const created = toDate(appUser.createdAt);
  const initials = appUser.displayName
    ? appUser.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (appUser.email?.[0] ?? "?").toUpperCase();

  return (
    <GlassCard hairline className="p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          className="shrink-0"
        >
          <Avatar className="h-20 w-20 hairline">
            <AvatarImage src={appUser.photoURL ?? undefined} />
            <AvatarFallback className="bg-card font-mono text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h2 className="font-mono text-2xl font-medium truncate">
              {appUser.displayName ?? "Anonyme"}
            </h2>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider rounded-full border px-2 py-0.5 inline-flex items-center gap-1.5 ${role.classes}`}
            >
              {role.dot}
              {role.label}
            </span>
            {/* PLAYER-only identity pills */}
            {appUser.role === "PLAYER" && appUser.skillLevel && (
              <span className="font-mono text-[10px] uppercase tracking-wider rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5">
                {appUser.skillLevel}
              </span>
            )}
            {appUser.role === "PLAYER" && appUser.position && appUser.position !== "ANY" && (
              <span className="font-mono text-[10px] uppercase tracking-wider rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5">
                {appUser.position}
              </span>
            )}
          </div>

          {appUser.bio && (
            <p className="text-sm text-foreground/75 mb-3 line-clamp-2">{appUser.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              {appUser.email}
            </span>
            {created && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                membre depuis {format(created, "MMM yyyy", { locale: fr })}
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </GlassCard>
  );
}

"use client";

import Link from "next/link";
import { Edit3, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { GradientText } from "@/components/ui/gradient-text";

// Shared components
import { ProfileHeader } from "./_components/ProfileHeader";
import { AccountHealthStrip } from "./_components/AccountHealthStrip";
import { AccountFooter } from "./_components/AccountFooter";
import { ProfileSkeleton } from "./_components/ProfileSkeleton";

// Module registry — role → ordered list of module slots
import { PROFILE_MODULES } from "./_components/modules/registry";

export default function ProfilePage() {
  const { appUser } = useAuth();
  const data = useProfileData();

  // Auth context is loading (first paint)
  if (!appUser) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
        <ProfileSkeleton />
      </div>
    );
  }

  const modules = PROFILE_MODULES[appUser.role] ?? [];

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      {/* ── Page title row ── */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / profil
          </div>
          <h1 className="font-mono text-3xl font-medium">
            <GradientText className="font-medium">votre identité</GradientText>
          </h1>
        </div>
        <Link
          href="/profile/edit"
          className="hairline inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-card/60 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" />
          modifier
        </Link>
      </div>

      {/* ── Data fetch error banner ── */}
      {data.error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-5 py-4 font-mono text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {data.error}
        </div>
      )}

      {/* ── Skeleton while role-specific data loads ── */}
      {data.loading ? (
        <ProfileSkeleton />
      ) : (
        <div className="space-y-6">
          {/* SHARED: identity header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ProfileHeader appUser={appUser} />
          </motion.div>

          {/* SHARED: account health strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
          >
            <AccountHealthStrip appUser={appUser} data={data} />
          </motion.div>

          {/* ROLE-SPECIFIC modules — rendered from registry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map(({ key, Component, colSpan }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.12 + i * 0.07,
                  duration: 0.38,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className={colSpan === "full" ? "md:col-span-2" : ""}
              >
                <Component appUser={appUser} data={data} />
              </motion.div>
            ))}
          </div>

          {/* SHARED: wallet + last login */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + modules.length * 0.07, duration: 0.35 }}
          >
            <AccountFooter appUser={appUser} data={data} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Wallet,
  Sparkles,
  ArrowUpRight,
  Activity,
  Clock,
  User,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricTile } from "@/components/ui/metric-tile";
import { GradientText } from "@/components/ui/gradient-text";
import { LiveDot } from "@/components/ui/live-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserBookings,
  getUserTeams,
  getRecentPosts,
} from "@/services/db";
import type { Booking, Team, Post } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow } from "date-fns";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export default function DashboardPage() {
  const { user, appUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [b, t, p] = await Promise.all([
          getUserBookings(user.uid),
          getUserTeams(user.uid),
          getRecentPosts(8),
        ]);
        setBookings(b);
        setTeams(t);
        setPosts(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const upcoming = bookings
    .filter((b) => {
      const date = toDate(b.startTime);
      return date && date > new Date() && b.status !== "CANCELLED";
    })
    .sort((a, b) => {
      const da = toDate(a.startTime)?.getTime() ?? 0;
      const dbt = toDate(b.startTime)?.getTime() ?? 0;
      return da - dbt;
    });

  const totalSpent = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);

  return (
    <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / console · {appUser?.role ?? "JOUEUR"}
          </div>
          <h1 className="font-mono text-3xl md:text-4xl font-medium tracking-tight">
            bjr,{" "}
            <GradientText className="font-medium">
              {appUser?.displayName?.split(" ")[0] ?? "joueur"}
            </GradientText>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            voici l&apos;aperçu de votre protocole pour aujourd&apos;hui.
          </p>
        </div>
        <Link
          href="/stadiums"
          className="hairline inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-card/60 transition-colors w-fit"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          réserver un terrain
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPI Tiles */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8"
      >
        {(loading ? [1, 2, 3] : null) ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : null}
        {!loading && (
          <>
            <MetricTile
              label="réservations · actives"
              value={upcoming.length}
              hint={`sur ${bookings.length} au total`}
              icon={<Calendar className="h-3 w-3" />}
            />
            <MetricTile
              label="équipes"
              value={teams.length}
              hint="effectifs rejoints"
              icon={<Users className="h-3 w-3" />}
            />
            <MetricTile
              label="portefeuille"
              value={`${(appUser?.walletBalance ?? 0).toFixed(0)} TND`}
              hint={`dépensé · ${totalSpent.toFixed(0)} TND`}
              icon={<Wallet className="h-3 w-3" />}
            />
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming bookings */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-0 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                sessions à venir
              </div>
              <Link
                href="/bookings"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                voir tout →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-5">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : upcoming.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-mono text-xs text-muted-foreground">
                    aucune réservation à venir.
                  </p>
                  <Link
                    href="/stadiums"
                    className="mt-3 inline-block font-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
                  >
                    réserver maintenant →
                  </Link>
                </div>
              ) : (
                upcoming.slice(0, 4).map((b) => {
                  const start = toDate(b.startTime);
                  return (
                    <Link
                      key={b.id}
                      href={`/bookings/${b.id}`}
                      className="block p-5 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="hairline grid h-10 w-10 place-items-center rounded-lg bg-card shrink-0">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono text-sm truncate">
                              {b.stadiumName ?? "Réservation de stade"}
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {start ? format(start, "EEE MMM dd · HH:mm") : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm tabular-nums">
                            {b.totalPrice.toFixed(0)} TND
                          </div>
                          <div
                            className={`font-mono text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            }`}
                          >
                            {b.status.toLowerCase()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* Recent feed */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                pouls de la communauté
              </div>
              <Link
                href="/feed"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                ouvrir le fil →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-5">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-muted-foreground">
                  aucun post pour le moment.
                </div>
              ) : (
                posts.slice(0, 4).map((p) => {
                  const date = toDate(p.createdAt);
                  return (
                    <div key={p.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="hairline grid h-8 w-8 place-items-center rounded-full bg-card font-mono text-xs shrink-0">
                          {p.authorName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              {p.authorName}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {date ? formatDistanceToNow(date, { addSuffix: true }) : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-foreground/80 line-clamp-2">
                            {p.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <GlassCard hairline className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              / identité
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-2xl font-medium">
                  <GradientText className="font-medium">
                    {appUser?.role ?? "JOUEUR"}
                  </GradientText>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  rôle actif
                </div>
              </div>
              <LiveDot variant="online" />
            </div>
            <div className="space-y-2 text-xs font-mono">
              {appUser?.position && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">poste</span>
                  <span>{appUser.position}</span>
                </div>
              )}
              {appUser?.skillLevel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">niveau</span>
                  <span>{appUser.skillLevel}</span>
                </div>
              )}
              {appUser?.bio && (
                <p className="mt-2 text-muted-foreground line-clamp-3 leading-relaxed">
                  {appUser.bio}
                </p>
              )}
              {!appUser?.position && !appUser?.skillLevel && !appUser?.bio && (
                <p className="text-muted-foreground">
                  profil incomplet —{" "}
                  <Link href="/profile" className="text-primary hover:underline">
                    compléter →
                  </Link>
                </p>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <Link
                href="/profile"
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-3 w-3" />
                voir le profil complet →
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
              / actions rapides
            </div>
            <div className="space-y-2">
              {[
                { label: "Parcourir les stades", href: "/stadiums" },
                { label: "Mes réservations",     href: "/bookings" },
                { label: "Mon portefeuille",     href: "/wallet"   },
                { label: "Trouver une équipe",   href: "/teams"    },
                { label: "Ouvrir le support",    href: "/support"  },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-xs hover:bg-white/[0.04] transition-colors"
                >
                  <span className="uppercase tracking-wider">{q.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

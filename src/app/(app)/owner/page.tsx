"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, Calendar, DollarSign, TrendingUp, Clock,
  CheckCircle, XCircle, ArrowRight, BarChart3, MapPin,
  CalendarClock, Users, Zap, Bell, AlertCircle, Loader2,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { LiveDot } from "@/components/ui/live-dot";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOwnerBookings, getStadiumsByOwner,
  updateBookingStatus, createNotification,
} from "@/services/db";
import type { Booking, Stadium } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

function toDate(t: unknown): Date {
  if (!t) return new Date();
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  if (typeof t === "object" && (t as any).toDate) return (t as any).toDate();
  return new Date(t as string);
}

// ── sub-components ────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon: Icon, color, bg, border, href,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string; bg: string; border: string; href: string;
}) {
  return (
    <Link href={href}>
      <GlassCard className={`p-5 border ${border} hover:bg-white/[0.03] transition-colors group cursor-pointer`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
          <div className={`p-2 rounded-lg ${bg} group-hover:scale-110 transition-transform`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
        <div className="font-mono text-3xl font-semibold tabular-nums">{value}</div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">{sub}</div>
        <div className={`mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider ${color} opacity-0 group-hover:opacity-100 transition-opacity`}>
          voir détails <ArrowRight className="h-2.5 w-2.5" />
        </div>
      </GlassCard>
    </Link>
  );
}

function NavCard({
  href, icon: Icon, label, description, accent, iconColor,
}: {
  href: string; icon: React.ElementType; label: string;
  description: string; accent: string; iconColor: string;
}) {
  return (
    <Link href={href}>
      <GlassCard className="p-5 hover:bg-white/[0.03] transition-all group cursor-pointer h-full">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="font-mono text-sm font-medium mb-1">{label}</div>
        <div className="font-mono text-[10px] text-muted-foreground leading-relaxed">{description}</div>
        <div className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
          accéder <ArrowRight className="h-2.5 w-2.5" />
        </div>
      </GlassCard>
    </Link>
  );
}

// ── main page ─────────────────────────────────────────────────────────
export default function OwnerConsolePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getOwnerBookings(user.uid),
      getStadiumsByOwner(user.uid),
    ]).then(([b, s]) => {
      setBookings(b.sort((a, z) => toDate(z.createdAt).getTime() - toDate(a.createdAt).getTime()));
      setStadiums(s);
    }).finally(() => setLoading(false));
  }, [user]);

  // ── derived stats ───────────────────────────────────────────────────
  const confirmed  = useMemo(() => bookings.filter(b => b.status === "CONFIRMED"), [bookings]);
  const pending    = useMemo(() => bookings.filter(b => b.status === "PENDING"),   [bookings]);
  const cancelled  = useMemo(() => bookings.filter(b => b.status === "CANCELLED"), [bookings]);
  const revenue    = useMemo(() => confirmed.reduce((s, b) => s + (b.totalPrice ?? 0), 0), [confirmed]);
  const todayRev   = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return confirmed
      .filter(b => toDate(b.createdAt) >= today)
      .reduce((s, b) => s + (b.totalPrice ?? 0), 0);
  }, [confirmed]);

  // recent 5 non-pending
  const recentActivity = useMemo(() =>
    bookings.filter(b => b.status !== "PENDING").slice(0, 5),
    [bookings]);

  // ── approve / reject ────────────────────────────────────────────────
  const handleStatus = async (b: Booking, status: Booking["status"]) => {
    if (!b.id) return;
    setProcessing(b.id);
    try {
      await updateBookingStatus(b.id, status);
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status } : x));
      toast.success(status === "CONFIRMED" ? "Réservation approuvée ✅" : "Réservation rejetée");
      await createNotification({
        userId: b.userId,
        type: "BOOKING",
        title: status === "CONFIRMED" ? "Réservation confirmée ✅" : "Réservation rejetée ❌",
        body: `Votre réservation pour ${b.stadiumName ?? "le stade"} a été ${status === "CONFIRMED" ? "approuvée" : "rejetée"}.`,
        href: "/bookings",
      });
    } catch {
      toast.error("Erreur réseau — réessayez");
    } finally {
      setProcessing(null);
    }
  };

  const kpis = [
    {
      label: "Revenu total", value: `${revenue.toFixed(0)} TND`,
      sub: `Aujourd'hui: ${todayRev.toFixed(0)} TND`,
      icon: DollarSign, color: "text-emerald-300",
      bg: "bg-emerald-500/10", border: "border-emerald-500/15",
      href: "/owner/analytics",
    },
    {
      label: "Réservations", value: confirmed.length,
      sub: `${cancelled.length} annulée${cancelled.length !== 1 ? "s" : ""}`,
      icon: Calendar, color: "text-sky-300",
      bg: "bg-sky-500/10", border: "border-sky-500/15",
      href: "/owner/reservations",
    },
    {
      label: "En attente", value: pending.length,
      sub: "À approuver maintenant",
      icon: Clock, color: "text-amber-300",
      bg: "bg-amber-500/10", border: "border-amber-500/15",
      href: "/owner/reservations",
    },
    {
      label: "Stades actifs", value: stadiums.length,
      sub: `${bookings.length} réservations au total`,
      icon: Building2, color: "text-violet-300",
      bg: "bg-violet-500/10", border: "border-violet-500/15",
      href: "/owner/stadiums",
    },
  ];

  const navItems = [
    {
      href: "/owner/stadiums", icon: MapPin, label: "Mes stades",
      description: "Ajouter, modifier ou supprimer vos terrains",
      accent: "from-emerald-500/20 to-teal-500/10", iconColor: "text-emerald-300",
    },
    {
      href: "/owner/reservations", icon: CalendarClock, label: "Réservations",
      description: "Approuver ou rejeter les demandes entrantes",
      accent: "from-sky-500/20 to-cyan-500/10", iconColor: "text-sky-300",
    },
    {
      href: "/owner/analytics", icon: BarChart3, label: "Analyses",
      description: "Revenus, taux d'occupation, heures de pointe",
      accent: "from-violet-500/20 to-purple-500/10", iconColor: "text-violet-300",
    },
  ];

  return (
    <AuthGuard requiredRole={["OWNER", "SUPER_ADMIN"]}>
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1 flex items-center gap-2">
              <LiveDot variant="online" />
              console propriétaire
            </div>
            <h1 className="font-mono text-3xl font-medium tracking-tight">
              Bienvenue, <GradientText>{user?.displayName?.split(" ")[0] ?? "Propriétaire"}</GradientText>
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {pending.length > 0 && (
            <Link href="/owner/reservations">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-mono text-xs text-amber-300"
              >
                <Bell className="h-3.5 w-3.5 animate-pulse" />
                {pending.length} demande{pending.length > 1 ? "s" : ""} en attente
                <ArrowRight className="h-3 w-3" />
              </motion.div>
            </Link>
          )}
        </div>

        {/* ── KPI Cards ── */}
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}>
                <KPICard {...k} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Two columns: pending + stadiums ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pending approvals */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                approbations en attente
                {pending.length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 text-[9px]">
                    {pending.length}
                  </span>
                )}
              </div>
              <Link href="/owner/reservations" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
                tout voir →
              </Link>
            </div>

            {loading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="font-mono text-xs text-muted-foreground">Tout est à jour — aucune demande en attente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 4).map((b) => {
                  const start = toDate(b.startTime);
                  const end   = toDate(b.endTime);
                  const dur   = Math.round((end.getTime() - start.getTime()) / 3600000);
                  return (
                    <div key={b.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="font-mono text-xs font-semibold text-foreground">{b.userName ?? "Client"}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{b.stadiumName}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs font-semibold text-primary tabular-nums">{(b.totalPrice ?? 0).toFixed(0)} TND</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{dur}h</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <CalendarClock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {format(start, "d MMM, HH:mm", { locale: fr })} → {format(end, "HH:mm")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(b, "CONFIRMED")}
                          disabled={processing === b.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          {processing === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Approuver
                        </button>
                        <button
                          onClick={() => handleStatus(b, "CANCELLED")}
                          disabled={processing === b.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 py-1.5 font-mono text-[10px] uppercase tracking-wider text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {processing === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Rejeter
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pending.length > 4 && (
                  <Link href="/owner/reservations" className="block text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1">
                    +{pending.length - 4} autre{pending.length - 4 > 1 ? "s" : ""} →
                  </Link>
                )}
              </div>
            )}
          </GlassCard>

          {/* My stadiums */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                mes stades
              </div>
              <Link href="/owner/stadiums" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
                gérer →
              </Link>
            </div>

            {loading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stadiums.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-mono text-xs text-muted-foreground mb-3">Aucun stade enregistré.</p>
                <Link href="/owner/stadiums" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90">
                  <Zap className="h-3 w-3" /> Ajouter un stade
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {stadiums.map((s) => {
                  const stBookings = bookings.filter(b => b.stadiumId === s.id && b.status === "CONFIRMED");
                  const stRevenue  = stBookings.reduce((acc, b) => acc + (b.totalPrice ?? 0), 0);
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors">
                      {s.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.images[0]} alt={s.name} className="h-12 w-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-12 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-semibold truncate">{s.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground truncate">{s.location}</div>
                        <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          {s.pricePerHour} TND/h
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-semibold text-primary tabular-nums">{stRevenue.toFixed(0)} TND</div>
                        <div className="font-mono text-[9px] text-muted-foreground">{stBookings.length} rés.</div>
                      </div>
                    </div>
                  );
                })}
                <Link href="/owner/stadiums" className="block text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 mt-1">
                  + ajouter un stade →
                </Link>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── Recent activity ── */}
        {recentActivity.length > 0 && (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                activité récente
              </div>
              <Link href="/owner/reservations" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
                tout voir →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {recentActivity.map((b) => {
                const start = toDate(b.startTime);
                const created = toDate(b.createdAt);
                const statusStyles: Record<string, string> = {
                  CONFIRMED: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10",
                  CANCELLED: "text-red-300 border-red-500/20 bg-red-500/10",
                  PENDING:   "text-amber-300 border-amber-500/20 bg-amber-500/10",
                };
                return (
                  <div key={b.id} className="flex items-center gap-4 py-3">
                    <div className="h-8 w-8 rounded-full border border-white/[0.08] bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs">
                        <span className="text-foreground/90">{b.userName ?? "Client"}</span>
                        <span className="text-muted-foreground"> → {b.stadiumName}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {format(start, "d MMM, HH:mm", { locale: fr })} · {formatDistanceToNow(created, { addSuffix: true, locale: fr })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-primary tabular-nums font-semibold">{(b.totalPrice ?? 0).toFixed(0)} TND</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${statusStyles[b.status] ?? "text-muted-foreground"}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* ── Quick nav ── */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">accès rapide</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {navItems.map((n, i) => (
              <motion.div key={n.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}>
                <NavCard {...n} />
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}

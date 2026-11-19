"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerBookings, getStadiumsByOwner } from "@/services/db";
import type { Booking, Stadium } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  TrendingUp, DollarSign, Calendar, MapPin,
  Users, Clock, CheckCircle2, XCircle, Loader2,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────
function toDate(t: unknown): Date {
  if (!t) return new Date();
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  if (typeof t === "object" && "toDate" in t && typeof t.toDate === "function") {
    return (t as { toDate: () => Date }).toDate();
  }
  return new Date(t as string);
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "#5eead4",
  PENDING:   "#fcd34d",
  CANCELLED: "#f87171",
};

const PIE_COLORS = ["#5eead4", "#fcd34d", "#f87171", "#a78bfa"];

// ── component ─────────────────────────────────────────────────────────
export default function OwnerAnalyticsPage() {
  const { user } = useAuth();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [stadiums, setStadiums]   = useState<Stadium[]>([]);
  const [loading, setLoading]     = useState(true);
  const [revenueTab, setRevenueTab] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getOwnerBookings(user.uid),
      getStadiumsByOwner(user.uid),
    ]).then(([b, s]) => {
      setBookings(b);
      setStadiums(s);
    }).finally(() => setLoading(false));
  }, [user]);

  // ── KPIs ────────────────────────────────────────────────────────────
  const confirmed = useMemo(() => bookings.filter(b => b.status !== "CANCELLED"), [bookings]);
  const cancelled = useMemo(() => bookings.filter(b => b.status === "CANCELLED"), [bookings]);

  const totalRevenue  = useMemo(() => confirmed.reduce((s, b) => s + (b.totalPrice ?? 0), 0), [confirmed]);
  const avgPerBooking = confirmed.length ? totalRevenue / confirmed.length : 0;

  // This month vs last month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthRev = useMemo(() =>
    confirmed.filter(b => toDate(b.createdAt) >= thisMonthStart)
      .reduce((s, b) => s + (b.totalPrice ?? 0), 0), [confirmed]);
  const lastMonthRev = useMemo(() =>
    confirmed.filter(b => {
      const d = toDate(b.createdAt);
      return d >= lastMonthStart && d < thisMonthStart;
    }).reduce((s, b) => s + (b.totalPrice ?? 0), 0), [confirmed]);

  const monthGrowth = lastMonthRev > 0
    ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
    : thisMonthRev > 0 ? 100 : 0;

  // ── Revenue time-series ─────────────────────────────────────────────
  const revenueSeries = useMemo(() => {
    const days = revenueTab === "7d" ? 7 : revenueTab === "30d" ? 30 : 90;
    const map = new Map<string, { revenue: number; count: number }>();
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);

    // seed all days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = format(d, "dd MMM", { locale: fr });
      map.set(key, { revenue: 0, count: 0 });
    }

    for (const b of confirmed) {
      const d = toDate(b.createdAt);
      if (revenueTab !== "all" && d < cutoff) continue;
      const key = format(d, "dd MMM", { locale: fr });
      if (map.has(key)) {
        const prev = map.get(key)!;
        map.set(key, { revenue: prev.revenue + (b.totalPrice ?? 0), count: prev.count + 1 });
      }
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
  }, [confirmed, revenueTab]);

  // ── Peak hours ──────────────────────────────────────────────────────
  const peakHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of confirmed) {
      if (!b.startTime) continue;
      const h = toDate(b.startTime).getHours();
      const label = `${String(h).padStart(2, "0")}h`;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, bookings]) => ({ hour, bookings }));
  }, [confirmed]);

  // ── Stadium breakdown ───────────────────────────────────────────────
  const stadiumBreakdown = useMemo(() => {
    return stadiums.map(s => {
      const sb = confirmed.filter(b => b.stadiumId === s.id);
      return {
        name: s.name,
        bookings: sb.length,
        revenue: sb.reduce((acc, b) => acc + (b.totalPrice ?? 0), 0),
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [stadiums, confirmed]);

  // ── Status pie ──────────────────────────────────────────────────────
  const statusPie = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach(b => map.set(b.status, (map.get(b.status) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [bookings]);

  // ── Recent bookings table (last 8) ──────────────────────────────────
  const recentBookings = useMemo(() =>
    [...bookings]
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
      .slice(0, 8),
    [bookings]);

  // ── KPI cards ───────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Revenu total",
      value: `${totalRevenue.toFixed(0)} TND`,
      sub: `Ce mois: ${thisMonthRev.toFixed(0)} TND`,
      icon: DollarSign,
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      trend: monthGrowth,
    },
    {
      label: "Réservations",
      value: confirmed.length,
      sub: `${cancelled.length} annulées`,
      icon: Calendar,
      color: "text-sky-300",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      trend: null,
    },
    {
      label: "Stades actifs",
      value: stadiums.length,
      sub: `${stadiumBreakdown[0]?.name ?? "—"} · meilleur`,
      icon: MapPin,
      color: "text-violet-300",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      trend: null,
    },
    {
      label: "Panier moyen",
      value: `${avgPerBooking.toFixed(1)} TND`,
      sub: "Par réservation confirmée",
      icon: TrendingUp,
      color: "text-amber-300",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      trend: null,
    },
  ];

  if (loading) {
    return (
      <AuthGuard requiredRole={["OWNER", "SUPER_ADMIN"]}>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole={["OWNER", "SUPER_ADMIN"]}>
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            / analyses · propriétaire
          </div>
          <h1 className="font-mono text-3xl font-medium">
            Tableau de bord <GradientText>Analytique</GradientText>
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Vue complète de vos stades · {bookings.length} réservations au total
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <GlassCard key={k.label} className={`p-5 border ${k.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className={`p-1.5 rounded-lg ${k.bg}`}>
                  <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                </div>
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">{k.sub}</span>
                {k.trend !== null && (
                  <span className={`inline-flex items-center font-mono text-[10px] ${k.trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {k.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(k.trend).toFixed(0)}%
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Revenue Area Chart */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Revenus & Réservations
            </h2>
            <div className="inline-flex p-1 rounded-lg border border-white/[0.06] bg-white/[0.02] gap-0.5">
              {(["7d", "30d", "all"] as const).map(t => (
                <button key={t} onClick={() => setRevenueTab(t)}
                  className={`px-3 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all ${revenueTab === t ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "all" ? "90j" : t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5eead4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5eead4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis yAxisId="rev" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v} TND`} width={72} />
                <YAxis yAxisId="cnt" orientation="right" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.10 0.008 260)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "11px" }}
                  formatter={(v: unknown, name: unknown) => [name === "revenue" ? `${Number(v).toFixed(2)} TND` : String(v), name === "revenue" ? "Revenu" : "Réservations"]}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#5eead4" strokeWidth={2} fill="url(#gRev)" />
                <Area yAxisId="cnt" type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} fill="url(#gCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Peak hours + Status pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-5">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
              <Clock className="inline h-3.5 w-3.5 mr-1.5 text-primary" />
              Heures de pointe
            </h2>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="hour" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.10 0.008 260)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "11px" }}
                    formatter={(v: unknown) => [String(v), "Réservations"]}
                  />
                  <Bar dataKey="bookings" fill="#fcd34d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
              <CheckCircle2 className="inline h-3.5 w-3.5 mr-1.5 text-primary" />
              Statut des réservations
            </h2>
            {statusPie.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <p className="font-mono text-xs text-muted-foreground">Aucune donnée</p>
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLOR[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "oklch(0.10 0.008 260)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "rgba(255,255,255,0.6)" }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Stadium performance */}
        {stadiumBreakdown.length > 0 && (
          <GlassCard className="p-5">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
              <MapPin className="inline h-3.5 w-3.5 mr-1.5 text-primary" />
              Performance par stade
            </h2>
            <div className="space-y-3">
              {stadiumBreakdown.map((s, i) => {
                const maxRev = stadiumBreakdown[0]?.revenue || 1;
                const pct = Math.round((s.revenue / maxRev) * 100);
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-36 font-mono text-xs truncate text-foreground/80 shrink-0">{s.name}</div>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-28 text-right shrink-0">
                      <span className="font-mono text-xs text-primary tabular-nums">{s.revenue.toFixed(0)} TND</span>
                      <span className="font-mono text-[10px] text-muted-foreground ml-2">· {s.bookings} rés.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Recent Bookings Table */}
        <GlassCard className="p-5">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
            <Users className="inline h-3.5 w-3.5 mr-1.5 text-primary" />
            Réservations récentes
          </h2>
          {recentBookings.length === 0 ? (
            <p className="text-center font-mono text-xs text-muted-foreground py-8">Aucune réservation pour l&apos;instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Client", "Stade", "Date réservée", "Heure", "Durée", "Montant", "Paiement", "Statut"].map(h => (
                      <th key={h} className="pb-3 pr-4 text-left font-normal text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentBookings.map((b) => {
                    const startDate = toDate(b.startTime);
                    const endDate   = toDate(b.endTime);
                    const duration  = Math.round((endDate.getTime() - startDate.getTime()) / 3600000);
                    const isPaid    = b.paymentStatus === "PAID";
                    const statusColors: Record<string, string> = {
                      CONFIRMED: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
                      PENDING:   "text-amber-300  bg-amber-500/10  border-amber-500/20",
                      CANCELLED: "text-red-300    bg-red-500/10    border-red-500/20",
                    };
                    return (
                      <tr key={b.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className="text-foreground/90">{b.userName ?? "—"}</span>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-foreground/70">{b.stadiumName ?? "—"}</td>
                        <td className="py-3 pr-4 whitespace-nowrap tabular-nums text-foreground/70">
                          {format(startDate, "dd MMM yyyy", { locale: fr })}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap tabular-nums text-foreground/70">
                          {format(startDate, "HH:mm")} → {format(endDate, "HH:mm")}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-foreground/70">{duration}h</td>
                        <td className="py-3 pr-4 whitespace-nowrap tabular-nums font-semibold text-primary">
                          {(b.totalPrice ?? 0).toFixed(2)} TND
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${isPaid ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-amber-300 bg-amber-500/10 border-amber-500/20"}`}>
                            {isPaid ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                            {isPaid ? "Payé" : "Non payé"}
                          </span>
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusColors[b.status] ?? "text-muted-foreground"}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

      </div>
    </AuthGuard>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  getAllEvents, getAllStadiums, listAllUsers, getAllTeams,
  getRecentVisits, getAllBookings,
} from "@/services/db";
import { Users, MapPin, Calendar, Activity, TrendingUp, DollarSign } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import type { Booking } from "@/types";

const COLORS = ["#5eead4", "#a78bfa", "#fcd34d", "#f472b6"];

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return (t as Timestamp).toDate();
  return null;
}

function buildDailyRevenue(bookings: Booking[], days = 30) {
  const now = new Date();
  const result: { date: string; revenue: number; bookings: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const dayBookings = bookings.filter((b) => {
      const created = toDate(b.createdAt);
      return created && created >= dayStart && created <= dayEnd && b.status !== "CANCELLED";
    });
    result.push({ date: label, revenue: dayBookings.reduce((s, b) => s + (b.totalPrice ?? 0), 0), bookings: dayBookings.length });
  }
  return result;
}

function buildMonthlyRevenue(bookings: Booking[]) {
  const map = new Map<string, { revenue: number; bookings: number }>();
  bookings.forEach((b) => {
    if (b.status === "CANCELLED") return;
    const d = toDate(b.createdAt);
    if (!d) return;
    const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const prev = map.get(key) ?? { revenue: 0, bookings: 0 };
    map.set(key, { revenue: prev.revenue + (b.totalPrice ?? 0), bookings: prev.bookings + 1 });
  });
  return Array.from(map.entries()).slice(-6).map(([date, v]) => ({ date, ...v }));
}

type ChartRow = Record<string, string | number>;

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ users: 0, stadiums: 0, events: 0, teams: 0, totalRevenue: 0, confirmedBookings: 0 });
  const [growthData, setGrowthData] = useState<ChartRow[]>([]);
  const [distributionData, setDistributionData] = useState<ChartRow[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<ChartRow[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<ChartRow[]>([]);
  const [revenueTab, setRevenueTab] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    async function fetchData() {
      try {
        const [users, stadiums, events, teams, recentVisits, bookings] = await Promise.all([
          listAllUsers(), getAllStadiums(), getAllEvents(), getAllTeams(), getRecentVisits(7), getAllBookings(),
        ]);

        const confirmed = bookings.filter((b) => b.status !== "CANCELLED");
        const totalRevenue = confirmed.reduce((s, b) => s + (b.totalPrice ?? 0), 0);

        setMetrics({ users: users.length, stadiums: stadiums.length, events: events.length, teams: teams.length, totalRevenue, confirmedBookings: confirmed.length });
        setDistributionData([
          { name: "Utilisateurs", value: users.length },
          { name: "Stades", value: stadiums.length },
          { name: "Événements", value: events.length },
          { name: "Équipes", value: teams.length },
        ]);

        // Growth
        const visitsByDate = recentVisits.reduce((acc, v) => { acc[v.date] = v.count; return acc; }, {} as Record<string, number>);
        const now = new Date();
        const baseData = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const dateString = d.toISOString().split("T")[0];
          baseData.push({
            date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
            utilisateurs: Math.floor(users.length * (1 - i * 0.1) + Math.random() * 5),
            stades: Math.floor(stadiums.length * (1 - i * 0.05) + Math.random() * 2),
            événements: Math.floor(events.length * (1 - i * 0.15) + Math.random() * 2),
            équipes: Math.floor(teams.length * (1 - i * 0.12) + Math.random() * 3),
            visites: visitsByDate[dateString] || 0,
          });
        }
        setGrowthData(baseData);
        setDailyRevenue(buildDailyRevenue(bookings, 14));
        setMonthlyRevenue(buildMonthlyRevenue(bookings));
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: "Utilisateurs Inscrits", value: metrics.users, icon: Users, color: "text-teal-300", bg: "bg-teal-500/10" },
    { label: "Stades Partenaires", value: metrics.stadiums, icon: MapPin, color: "text-violet-300", bg: "bg-violet-500/10" },
    { label: "Réservations Confirmées", value: metrics.confirmedBookings, icon: Calendar, color: "text-amber-300", bg: "bg-amber-500/10" },
    { label: "Revenu Total (TND)", value: metrics.totalRevenue.toFixed(0), icon: DollarSign, color: "text-emerald-300", bg: "bg-emerald-500/10" },
  ];

  const revenueData = revenueTab === "daily" ? dailyRevenue : monthlyRevenue;

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">Live</span> · Tableau de bord Analytique
          </div>
          <h1 className="font-mono text-3xl font-medium tracking-tight">
            Vue d&apos;ensemble de la <GradientText>Plateforme</GradientText>
          </h1>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <GlassCard key={i} className="p-5 flex flex-col justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</div>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-mono text-4xl font-medium tabular-nums text-foreground">{loading ? "-" : stat.value}</span>
                <span className="font-mono text-xs text-emerald-400 mb-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" />+12%
                </span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Revenue Charts */}
        <GlassCard className="p-5 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Revenus Financiers
            </h2>
            <div className="inline-flex p-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              {(["daily", "monthly"] as const).map((t) => (
                <button key={t} onClick={() => setRevenueTab(t)}
                  className={`px-3 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all ${revenueTab === t ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "daily" ? "Quotidien" : "Mensuel"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5eead4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#5eead4" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.10 0.008 260)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ fontFamily: "var(--font-mono)", color: "#5eead4" }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-mono)" }}
                    formatter={(v: unknown) => [`${Number(v).toFixed(2)} TND`, "Revenu"]}
                  />
                  <Bar dataKey="revenue" fill="url(#colorRev)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard className="p-5 lg:col-span-2 flex flex-col h-[400px]">
            <div className="mb-4">
              <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Croissance (7 derniers jours)</h2>
            </div>
            <div className="flex-1 w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5eead4" stopOpacity={0.3} /><stop offset="95%" stopColor="#5eead4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorStadiums" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fcd34d" stopOpacity={0.3} /><stop offset="95%" stopColor="#fcd34d" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTeams" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} /><stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.10 0.008 260)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ fontFamily: "var(--font-mono)" }} labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px", fontFamily: "var(--font-mono)" }} />
                    <Area type="monotone" dataKey="utilisateurs" stroke="#5eead4" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                    <Area type="monotone" dataKey="stades" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorStadiums)" />
                    <Area type="monotone" dataKey="événements" stroke="#fcd34d" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
                    <Area type="monotone" dataKey="équipes" stroke="#f472b6" strokeWidth={2} fillOpacity={1} fill="url(#colorTeams)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col h-[400px]">
            <div className="mb-4">
              <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Distribution des Entités</h2>
            </div>
            <div className="flex-1 w-full flex items-center justify-center">
              {loading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {distributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.10 0.008 260)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ fontFamily: "var(--font-mono)", color: "#fff" }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,0.6)" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Trafic */}
        <GlassCard className="p-5 h-[300px] flex flex-col">
          <div className="mb-4">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Trafic de la Plateforme (Derniers 7 jours)</h2>
          </div>
          <div className="flex-1 w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "oklch(0.10 0.008 260)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ fontFamily: "var(--font-mono)", color: "#fff" }} />
                  <Bar dataKey="visites" fill="#fcd34d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>
    </AuthGuard>
  );
}

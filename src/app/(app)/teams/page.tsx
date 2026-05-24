"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trophy, Users, ArrowUpRight, Crown } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTeams, getUserTeams } from "@/services/db";
import type { Team } from "@/types";

export default function TeamsPage() {
  const { user } = useAuth();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([getAllTeams(), getUserTeams(user.uid)])
      .then(([a, m]) => {
        setAllTeams(a);
        setMyTeams(m);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const list = tab === "mine" ? myTeams : allTeams;
  const filtered = list.filter(
    (t) =>
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.tag?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / équipes
          </div>
          <h1 className="font-mono text-3xl font-medium">
            <GradientText className="font-medium">escouades</GradientText>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/teams/invitations"
            className="hairline inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-card/60 transition-colors"
          >
            invitations
          </Link>
          <Link
            href="/teams/create"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            créer une équipe
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="inline-flex p-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all ${
                tab === t
                  ? "bg-card text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "explorer" : "mes équipes"}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="rechercher des équipes..."
          className="md:flex-1 max-w-sm h-10 bg-white/[0.02] border-white/[0.06] font-mono"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            {tab === "mine"
              ? "vous n'avez pas encore rejoint d'équipe."
              : "aucune équipe trouvée."}
          </p>
          <Link
            href="/teams/create"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-primary hover:underline"
          >
            en créer une →
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Link key={t.id} href={`/teams/${t.id}`}>
              <GlassCard hover className="p-5 h-full">
                <div className="flex items-start gap-3 mb-4">
                  <div className="hairline grid h-12 w-12 place-items-center rounded-lg bg-card font-mono text-sm shrink-0">
                    {t.tag ?? t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono font-medium text-base truncate">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {t.memberIds?.length ?? 0} membres
                    </div>
                  </div>
                  {user && t.captainId === user.uid && (
                    <Crown className="h-4 w-4 text-amber-300" />
                  )}
                </div>
                {t.description && (
                  <p className="text-sm text-foreground/70 line-clamp-2 mb-4">
                    {t.description}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
                  <Stat label="V" value={t.stats?.wins ?? 0} color="text-emerald-300" />
                  <Stat label="N" value={t.stats?.draws ?? 0} color="text-amber-300" />
                  <Stat label="D" value={t.stats?.losses ?? 0} color="text-red-300" />
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {t.stats?.matchesPlayed ?? 0} matchs
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className={`font-mono text-lg tabular-nums ${color ?? ""}`}>
        {value}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

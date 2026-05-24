"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { getAllTeams, deleteTeam } from "@/services/db";
import type { Team } from "@/types";
import { Users, Crown, Trash2, Loader2, Shield, CalendarDays } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { formatDistanceToNow, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getAllTeams()
      .then(setTeams)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (team: Team) => {
    if (!team.id) return;
    if (!window.confirm(`Supprimer l'équipe "${team.name}" définitivement ?`)) return;
    setDeletingId(team.id);
    try {
      await deleteTeam(team.id);
      setTeams((t) => t.filter((x) => x.id !== team.id));
      toast.success("Équipe supprimée");
    } catch {
      toast.error("Échec de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = teams.filter(
    (t) =>
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.tag?.toLowerCase().includes(query.toLowerCase()),
  );

  // ── Real stats derived from the fetched data ──────────────────────────────
  const thirtyDaysAgo = subDays(new Date(), 30);

  const totalMembers = teams.reduce(
    (acc, t) => acc + (t.memberIds?.length ?? 0),
    0,
  );

  // Active = at least 3 members (a real squad, not an empty shell)
  const activeTeams = teams.filter((t) => (t.memberIds?.length ?? 0) >= 3).length;

  // Created in the last 30 days
  const recentTeams = teams.filter((t) => {
    const d = toDate(t.createdAt);
    return d !== null && d >= thirtyDaysAgo;
  }).length;

  const stats = [
    { label: "Total équipes",    value: teams.length,  icon: Shield },
    { label: "Total membres",    value: totalMembers,  icon: Users },
    { label: "Équipes actives",  value: activeTeams,   icon: Crown,        hint: "≥ 3 membres" },
    { label: "Créées ce mois",   value: recentTeams,   icon: CalendarDays, hint: "30 derniers jours" },
  ];

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / admin · équipes
          </div>
          <h1 className="font-mono text-3xl font-medium">
            Gestion des <GradientText>Équipes</GradientText>
          </h1>
        </div>

        {/* Stats tiles — all derived from real fetched data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <GlassCard key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="h-4 w-4 text-primary/60" />
              </div>
              <div className="font-mono text-3xl font-medium tabular-nums">
                {loading ? "—" : s.value}
              </div>
              {s.hint && (
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {s.hint}
                </div>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Search */}
        <GlassCard className="p-4 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou tag..."
            className="w-full bg-transparent font-mono text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </GlassCard>

        {/* Team list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <p className="font-mono text-xs text-muted-foreground">Aucune équipe trouvée.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filtered.map((team) => {
              const date = toDate(team.createdAt);
              const memberCount = team.memberIds?.length ?? 0;
              const isActive = memberCount >= 3;

              return (
                <GlassCard key={team.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center font-mono text-sm font-bold shrink-0">
                      {team.tag ?? team.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold truncate">
                          {team.name}
                        </span>
                        {team.tag && (
                          <span className="font-mono text-[10px] border border-white/[0.08] rounded-full px-2 py-0.5 text-muted-foreground">
                            {team.tag}
                          </span>
                        )}
                        {/* Active badge — only shown when a team has real members */}
                        {isActive && (
                          <span className="font-mono text-[10px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 rounded-full px-2 py-0.5">
                            active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 font-mono text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {memberCount} membre{memberCount !== 1 ? "s" : ""}
                        </span>
                        {date && (
                          <span>
                            Créée {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(team)}
                      disabled={deletingId === team.id}
                      className="h-9 w-9 flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {deletingId === team.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

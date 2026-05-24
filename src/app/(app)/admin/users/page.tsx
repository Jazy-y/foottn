"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { listAllUsers, updateUserProfile, deleteUserProfile } from "@/services/db";
import type { User, Role } from "@/types";
import { toast } from "sonner";
import {
  Trash2, Search, Users, Shield, Building2,
  User as UserIcon, Loader2, Crown,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  if (typeof t === "object" && (t as any).toDate) return (t as any).toDate();
  return null;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  PLAYER:      { label: "Joueur",      color: "text-sky-300",     bg: "bg-sky-500/10",     border: "border-sky-500/20",     icon: UserIcon  },
  OWNER:       { label: "Propriétaire",color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  icon: Building2 },
  SUPER_ADMIN: { label: "Admin",       color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: Crown     },
};

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listAllUsers()
      .then(setUsers)
      .catch(() => toast.error("Échec du chargement"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const counts = useMemo(() => ({
    total:  users.length,
    player: users.filter((u) => u.role === "PLAYER").length,
    owner:  users.filter((u) => u.role === "OWNER").length,
    admin:  users.filter((u) => u.role === "SUPER_ADMIN").length,
  }), [users]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserProfile(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("Rôle mis à jour");
    } catch {
      toast.error("Échec de la mise à jour");
    }
  };

  const handleDelete = async (u: User) => {
    if (!window.confirm(`Supprimer "${u.displayName}" définitivement ?`)) return;
    setDeletingId(u.id);
    try {
      await deleteUserProfile(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success("Utilisateur supprimé");
    } catch {
      toast.error("Échec de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const kpis = [
    { label: "Total",          value: counts.total,  icon: Users,    color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/15" },
    { label: "Joueurs",        value: counts.player, icon: UserIcon, color: "text-sky-300",    bg: "bg-sky-500/10",    border: "border-sky-500/15" },
    { label: "Propriétaires",  value: counts.owner,  icon: Building2,color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/15" },
    { label: "Admins",         value: counts.admin,  icon: Crown,    color: "text-amber-300",  bg: "bg-amber-500/10",  border: "border-amber-500/15" },
  ];

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            / admin · utilisateurs
          </div>
          <h1 className="font-mono text-3xl font-medium">
            Gestion des <GradientText>Utilisateurs</GradientText>
          </h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <GlassCard key={k.label} className={`p-4 border ${k.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                <div className={`p-1.5 rounded-lg ${k.bg}`}>
                  <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                </div>
              </div>
              <div className="font-mono text-3xl font-semibold tabular-nums">{loading ? "—" : k.value}</div>
            </GlassCard>
          ))}
        </div>

        {/* Search + role filter */}
        <GlassCard className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full bg-transparent font-mono text-sm outline-none text-foreground placeholder:text-muted-foreground pl-8"
            />
          </div>
          <div className="inline-flex p-1 rounded-lg border border-white/[0.06] bg-white/[0.02] gap-0.5 shrink-0">
            {(["ALL", "PLAYER", "OWNER", "SUPER_ADMIN"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all ${roleFilter === r ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r === "ALL" ? "Tous" : r === "SUPER_ADMIN" ? "Admin" : r === "OWNER" ? "Proprio" : "Joueur"}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* User list */}
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <p className="font-mono text-xs text-muted-foreground">Aucun utilisateur trouvé.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => {
              const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.PLAYER;
              const RoleIcon = cfg.icon;
              const createdAt = toDate((u as any).createdAt);
              const initial = (u.displayName || u.email || "?").charAt(0).toUpperCase();
              return (
                <GlassCard key={u.id} className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-white/[0.08] flex items-center justify-center font-mono text-sm font-semibold text-primary shrink-0">
                    {u.photoURL
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={u.photoURL} alt={initial} className="h-full w-full rounded-full object-cover" />
                      : initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium truncate">{u.displayName || "—"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">{u.email}</div>
                    {createdAt && (
                      <div className="font-mono text-[9px] text-muted-foreground/60 mt-0.5">
                        Inscrit {formatDistanceToNow(createdAt, { addSuffix: true, locale: fr })}
                      </div>
                    )}
                  </div>

                  {/* Role badge + selector */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${cfg.border} ${cfg.bg}`}>
                      <RoleIcon className={`h-3 w-3 ${cfg.color}`} />
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      className="bg-card border border-white/[0.08] rounded-lg px-2 py-1.5 font-mono text-[10px] text-foreground outline-none hover:border-white/[0.15] transition-colors"
                    >
                      <option value="PLAYER">PLAYER</option>
                      <option value="OWNER">OWNER</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={deletingId === u.id}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors disabled:opacity-50"
                      title="Supprimer l'utilisateur"
                    >
                      {deletingId === u.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
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

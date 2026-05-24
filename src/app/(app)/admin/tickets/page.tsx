"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  listAllTickets,
  listAllUsers,
  updateTicketStatus,
} from "@/services/db";
import type { Ticket, User } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  OPEN: {
    label: "Ouvert",
    icon: AlertCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    ring: "ring-emerald-400/20",
  },
  IN_PROGRESS: {
    label: "En cours",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    ring: "ring-amber-400/20",
  },
  CLOSED: {
    label: "Fermé",
    icon: CheckCircle2,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    ring: "ring-slate-400/20",
  },
} as const;

const PRIORITY_CONFIG = {
  LOW: { label: "Faible", color: "text-slate-400" },
  MEDIUM: { label: "Moyen", color: "text-amber-400" },
  HIGH: { label: "Élevé", color: "text-red-400" },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts: unknown) {
  try {
    const date =
      ts && typeof (ts as { toDate?: () => Date }).toDate === "function"
        ? (ts as { toDate: () => Date }).toDate()
        : new Date(ts as string);
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch {
    return "—";
  }
}

function Avatar({
  user,
  size = "md",
}: {
  user?: User;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-xs";
  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName}
        className={`${dim} rounded-full object-cover ring-1 ring-white/10 shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-primary/20 flex items-center justify-center font-mono font-bold text-primary shrink-0`}
    >
      {initials}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED">("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [tix, userList] = await Promise.all([
        listAllTickets(),
        listAllUsers(),
      ]);
      setTickets(tix);
      const map: Record<string, User> = {};
      userList.forEach((u) => { if (u.id) map[u.id] = u; });
      setUsers(map);
    } catch {
      toast.error("Impossible de charger les tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (id: string, status: Ticket["status"]) => {
    setUpdating(id);
    try {
      await updateTicketStatus(id, status);
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(null);
    }
  };

  const filtered =
    filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter);

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
  };

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              / admin · tickets support
            </div>
            <h1 className="font-mono text-3xl font-medium">
              <GradientText className="font-medium">tickets support</GradientText>
            </h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            rafraîchir
          </button>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["ALL", "OPEN", "IN_PROGRESS", "CLOSED"] as const).map((key) => {
            const cfg = key === "ALL" ? null : STATUS_CONFIG[key];
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="font-mono text-2xl font-bold">{counts[key]}</div>
                <div className={`font-mono text-[10px] uppercase tracking-wider mt-1 ${cfg ? cfg.color : "text-muted-foreground"}`}>
                  {key === "ALL" ? "Tous" : cfg!.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Ticket list ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-sm text-muted-foreground">Aucun ticket trouvé</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => {
              const sender = users[ticket.userId];
              const sCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
              const pCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.MEDIUM;
              const StatusIcon = sCfg.icon;
              const isUpdating = updating === ticket.id;

              return (
                <GlassCard key={ticket.id} hairline className="p-5 group">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* ── User avatar + info ── */}
                    <div className="flex items-center gap-3 min-w-0 sm:w-56">
                      <Avatar user={sender} />
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold truncate">
                          {sender?.displayName ?? "Utilisateur inconnu"}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground truncate">
                          {sender?.email ?? ticket.userId.slice(0, 12) + "…"}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 mt-0.5">
                          {sender?.role ?? "—"}
                        </div>
                      </div>
                    </div>

                    {/* ── Ticket content ── */}
                    <Link href={`/support/${ticket.id}`} className="flex-1 min-w-0 space-y-1.5 block hover:opacity-80 transition-opacity">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold leading-snug flex-1">
                          {ticket.subject}
                        </span>
                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ring-1 ${sCfg.bg} ${sCfg.color} ${sCfg.ring}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {sCfg.label}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <span className={`font-mono text-[10px] uppercase tracking-wider ${pCfg.color}`}>
                          ● {pCfg.label}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </span>
                        {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              màj {formatDate(ticket.updatedAt)}
                            </span>
                          </>
                        )}
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-auto group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </Link>

                    {/* ── Status actions ── */}
                    <div className="flex sm:flex-col gap-1.5 shrink-0">
                      {(["OPEN", "IN_PROGRESS", "CLOSED"] as const).map((s) => {
                        const c = STATUS_CONFIG[s];
                        const active = ticket.status === s;
                        return (
                          <button
                            key={s}
                            disabled={active || isUpdating}
                            onClick={() => changeStatus(ticket.id!, s)}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all border ${
                              active
                                ? `${c.bg} ${c.color} ${c.ring} ring-1 border-transparent`
                                : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04]"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpdating && active ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <c.icon className="h-3 w-3" />
                            )}
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
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

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { useAuth } from "@/contexts/AuthContext";
import { createTicket, getUserTickets } from "@/services/db";
import type { Ticket } from "@/types";
import { AlertCircle, CheckCircle2, Clock, Loader2, MessageSquare, Plus, Send, ShieldAlert } from "lucide-react";

const STATUS_CONFIG = {
  OPEN: { label: "Ouvert", icon: AlertCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
  IN_PROGRESS: { label: "En cours", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20" },
  CLOSED: { label: "Fermé", icon: CheckCircle2, color: "text-slate-400", bg: "bg-slate-400/10", ring: "ring-slate-400/20" },
} as const;

export default function SupportPage() {
  const { user, appUser } = useAuth();
  const isAdmin = appUser?.role === "SUPER_ADMIN";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isAdmin) { setLoading(false); return; }
    (async () => {
      setTickets(await getUserTickets(user.uid));
      setLoading(false);
    })();
  }, [user, isAdmin]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await createTicket({ userId: user.uid, subject, description, priority: "MEDIUM" });
      setSubject("");
      setDescription("");
      setTickets(await getUserTickets(user.uid));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Admin redirect prompt ──────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <AuthGuard>
        <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              / support
            </div>
            <h1 className="font-mono text-3xl font-medium">
              <GradientText className="font-medium">support</GradientText>
            </h1>
          </div>
          <GlassCard hairline className="p-8 flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold mb-1">Espace administrateur</p>
              <p className="font-mono text-xs text-muted-foreground max-w-sm">
                En tant qu'administrateur, la gestion des tickets se fait depuis la console admin.
              </p>
            </div>
            <Link
              href="/admin/tickets"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              gérer les tickets support
            </Link>
          </GlassCard>
        </div>
      </AuthGuard>
    );
  }

  // ── Regular user view ──────────────────────────────────────────────────────
  return (
    <AuthGuard>
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / support
          </div>
          <h1 className="font-mono text-3xl font-medium">
            <GradientText className="font-medium">support</GradientText>
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            Signalez un problème ou posez une question à notre équipe.
          </p>
        </div>

        {/* Create ticket form */}
        <GlassCard hairline className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">nouveau ticket</span>
          </div>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">sujet</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Décrivez le problème en quelques mots..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expliquez en détail ce qui s'est passé..."
                rows={4}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors resize-none"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                envoyer
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Ticket list */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            vos tickets
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-mono text-xs text-muted-foreground">Aucun ticket pour le moment</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.OPEN;
                const Icon = cfg.icon;
                return (
                  <Link key={t.id} href={`/support/${t.id}`}>
                    <GlassCard className="p-4 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-sm font-semibold truncate">{t.subject}</div>
                          <div className="font-mono text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ring-1 shrink-0 ${cfg.bg} ${cfg.color} ${cfg.ring}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

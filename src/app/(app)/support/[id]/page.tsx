"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  addTicketMessage,
  getTicketById,
  getUserProfile,
  subscribeToTicketMessages,
  updateTicketStatus,
} from "@/services/db";
import type { Ticket, TicketMessage, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  OPEN: { label: "Ouvert", icon: AlertCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
  IN_PROGRESS: { label: "En cours", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20" },
  CLOSED: { label: "Fermé", icon: CheckCircle2, color: "text-slate-400", bg: "bg-slate-400/10", ring: "ring-slate-400/20" },
} as const;

function formatTs(ts: unknown) {
  try {
    const d =
      ts && typeof (ts as { toDate?: () => Date }).toDate === "function"
        ? (ts as { toDate: () => Date }).toDate()
        : new Date(ts as string);
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  } catch {
    return "";
  }
}

function MiniAvatar({ user, isSupport }: { user?: User | null; isSupport?: boolean }) {
  if (isSupport) {
    return (
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <ShieldCheck className="h-4 w-4 text-primary" />
      </div>
    );
  }
  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  if (user?.photoURL) {
    return <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10 shrink-0" />;
  }
  return (
    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-muted-foreground shrink-0">
      {initials}
    </div>
  );
}

export default function SupportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, appUser } = useAuth();
  const isAdmin = appUser?.role === "SUPER_ADMIN";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [sender, setSender] = useState<User | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTicketById(id).then(async (t) => {
      setTicket(t);
      if (t?.userId) {
        const profile = await getUserProfile(t.userId);
        setSender(profile);
      }
    });
    const unsub = subscribeToTicketMessages(id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return () => unsub();
  }, [id]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      await addTicketMessage({
        ticketId: id,
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? "Anonyme",
        fromSupport: isAdmin,
        text: text.trim(),
      });
      setText("");
    } catch {
      toast.error("Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status: Ticket["status"]) => {
    if (!ticket?.id) return;
    setUpdatingStatus(true);
    try {
      await updateTicketStatus(ticket.id, status);
      setTicket((prev) => prev ? { ...prev, status } : prev);
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusCfg = ticket ? (STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN) : STATUS_CONFIG.OPEN;
  const StatusIcon = statusCfg.icon;
  const backHref = isAdmin ? "/admin/tickets" : "/support";

  return (
    <AuthGuard>
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto flex flex-col gap-5">
        {/* ── Back ── */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          retour
        </Link>

        {/* ── Ticket header ── */}
        {ticket && (
          <GlassCard hairline className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
                  ticket · {ticket.id?.slice(0, 8)}
                </div>
                <h1 className="font-mono text-xl font-semibold leading-snug">
                  <GradientText className="font-semibold">{ticket.subject}</GradientText>
                </h1>
                <p className="font-mono text-xs text-muted-foreground mt-2 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Sender info (shown to admin) */}
                {isAdmin && sender && (
                  <div className="mt-3 flex items-center gap-2">
                    <MiniAvatar user={sender} />
                    <div>
                      <span className="font-mono text-xs font-semibold">{sender.displayName}</span>
                      <span className="font-mono text-[10px] text-muted-foreground ml-2">{sender.email}</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ring-1 ${statusCfg.bg} ${statusCfg.color} ${statusCfg.ring}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusCfg.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    créé {formatTs(ticket.createdAt)}
                  </span>
                </div>
              </div>

              {/* Status controls (admin only) */}
              {isAdmin && (
                <div className="flex sm:flex-col gap-1.5 shrink-0">
                  {(["OPEN", "IN_PROGRESS", "CLOSED"] as const).map((s) => {
                    const c = STATUS_CONFIG[s];
                    const active = ticket.status === s;
                    return (
                      <button
                        key={s}
                        disabled={active || updatingStatus}
                        onClick={() => changeStatus(s)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all border ${
                          active
                            ? `${c.bg} ${c.color} ${c.ring} ring-1 border-transparent`
                            : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04]"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingStatus && active ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <c.icon className="h-3 w-3" />
                        )}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* ── Message thread ── */}
        <GlassCard hairline className="flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              conversation · {messages.length} message{messages.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[480px]">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full py-12">
                <p className="font-mono text-xs text-muted-foreground">Aucun message pour l&apos;instant</p>
              </div>
            )}
            {messages.map((m) => {
              const mine = m.authorId === user?.uid;
              const supportMsg = m.fromSupport;

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${mine ? "flex-row-reverse" : "flex-row"}`}
                >
                  <MiniAvatar
                    user={mine ? (appUser as unknown as User) : sender}
                    isSupport={supportMsg && !mine}
                  />
                  <div className={`max-w-[75%] space-y-1 ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="flex items-center gap-2">
                      {supportMsg && !mine && (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">
                          Support
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {mine ? "Vous" : m.authorName}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 font-mono text-sm leading-relaxed ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : supportMsg
                            ? "bg-violet-500/15 border border-violet-500/20 text-foreground rounded-tl-sm"
                            : "bg-white/[0.05] border border-white/[0.08] text-foreground rounded-tl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground/60">
                      {formatTs(m.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {ticket?.status !== "CLOSED" ? (
            <form
              onSubmit={onSend}
              className="flex gap-2 p-4 border-t border-white/[0.06]"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  isAdmin ? "Répondre en tant que support…" : "Écrire un message…"
                }
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                ) : (
                  <Send className="h-4 w-4 text-primary-foreground" />
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 border-t border-white/[0.06] text-center">
              <span className="font-mono text-xs text-muted-foreground">
                Ce ticket est fermé · {isAdmin && "rouvrez-le pour répondre"}
                {!isAdmin && "contactez le support pour le rouvrir"}
              </span>
            </div>
          )}
        </GlassCard>
      </div>
    </AuthGuard>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Globe,
  Lock,
  Sparkles,
  UserPlus,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { LiveDot } from "@/components/ui/live-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEventById,
  joinEvent,
  leaveEvent,
  getEventParticipants,
  deleteEvent,
} from "@/services/db";
import { autoBalanceTeams } from "@/services/ai";
import type { SportEvent, EventParticipant } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  if (!target) return null;
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

const POSITION_LABEL: Record<string, string> = {
  GK: "GB",
  DEF: "DEF",
  MID: "MIL",
  FWD: "ATT",
  ANY: "—",
};

const POSITION_COLOR: Record<string, string> = {
  GK: "text-amber-300 border-amber-500/20 bg-amber-500/10",
  DEF: "text-sky-300 border-sky-500/20 bg-sky-500/10",
  MID: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10",
  FWD: "text-rose-300 border-rose-500/20 bg-rose-500/10",
  ANY: "text-muted-foreground border-white/[0.06] bg-white/[0.02]",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = "participants" | "teams";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, appUser } = useAuth();
  const [ev, setEv] = useState<SportEvent | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [view, setView] = useState<View>("participants");

  useEffect(() => {
    if (!id) return;
    Promise.all([getEventById(id), getEventParticipants(id)])
      .then(([e, p]) => {
        setEv(e);
        setParticipants(p);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fix: memoize — recomputes only when participants change, NOT every countdown tick ──
  const balance = useMemo(() => autoBalanceTeams(participants), [participants]);
  const teamA = useMemo(() => balance.teams.filter((p) => p.team === "A"), [balance]);
  const teamB = useMemo(() => balance.teams.filter((p) => p.team === "B"), [balance]);

  const start = toDate(ev?.startTime);
  const countdown = useCountdown(start);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
        <GlassCard className="p-8 text-center">
          <p className="font-mono text-sm text-muted-foreground">Événement introuvable.</p>
        </GlassCard>
      </div>
    );
  }

  const isJoined = !!user && ev.participantIds?.includes(user.uid);
  const isFull = (ev.participantIds?.length ?? 0) >= ev.capacity && !isJoined;
  const filled = (ev.participantIds?.length ?? 0) / Math.max(1, ev.capacity);
  const canBalance = participants.length >= 2;

  // ── Actions ──────────────────────────────────────────────────────────────

  const join = async () => {
    if (!user || !ev.id) return;
    setWorking(true);
    try {
      const participantData: Parameters<typeof joinEvent>[1] = {
        userId: user.uid,
        userName: appUser?.displayName ?? user.email ?? "anon",
        userPhoto: user.photoURL ?? "",
        ...(appUser?.position ? { position: appUser.position } : {}),
        ...(appUser?.skillLevel ? { skillLevel: appUser.skillLevel } : {}),
      };
      await joinEvent(ev.id, participantData);
      const updated = await getEventParticipants(ev.id);
      setParticipants(updated);
      setEv((e) =>
        e ? { ...e, participantIds: [...(e.participantIds ?? []), user.uid] } : e,
      );
      toast.success("Événement rejoint");
    } catch {
      toast.error("Échec de l'adhésion");
    } finally {
      setWorking(false);
    }
  };

  const leave = async () => {
    if (!user || !ev.id) return;
    setWorking(true);
    try {
      await leaveEvent(ev.id, user.uid);
      setEv((e) =>
        e
          ? { ...e, participantIds: (e.participantIds ?? []).filter((x) => x !== user.uid) }
          : e,
      );
      setParticipants((prev) => prev.filter((p) => p.userId !== user.uid));
      toast.success("Événement quitté");
    } catch {
      toast.error("Échec pour quitter");
    } finally {
      setWorking(false);
    }
  };

  const removeEvent = async () => {
    if (!ev?.id) return;
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
    setWorking(true);
    try {
      await deleteEvent(ev.id);
      toast.success("Événement supprimé");
      router.push("/events");
    } catch {
      toast.error("Échec de la suppression");
      setWorking(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        événements
      </Link>

      {/* ── Event header card ── */}
      <GlassCard hairline className="p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              {ev.visibility === "PUBLIC" ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              / événement · {ev.visibility.toLowerCase()}
            </div>
            <h1 className="font-mono text-3xl md:text-4xl font-medium">
              <GradientText className="font-medium">{ev.title}</GradientText>
            </h1>
            {ev.description && (
              <p className="mt-3 text-sm text-foreground/80 max-w-2xl">{ev.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" />
                {start ? format(start, "EEE d MMM yyyy", { locale: fr }) : "—"}
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {start ? format(start, "HH:mm") : "—"}
              </div>
              {ev.location && (
                <div className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {ev.location}
                </div>
              )}
              <div className="inline-flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                organisé par {ev.hostName}
              </div>
            </div>
          </div>

          {countdown && (
            <div className="hairline rounded-xl bg-card p-4 grid grid-cols-4 gap-2 text-center min-w-[14rem]">
              <CountBlock label="j" v={countdown.d} />
              <CountBlock label="h" v={countdown.h} />
              <CountBlock label="m" v={countdown.m} />
              <CountBlock label="s" v={countdown.s} />
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          {/* Capacity bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
              <span className="text-muted-foreground">capacité</span>
              <span className="tabular-nums">
                {ev.participantIds?.length ?? 0} / {ev.capacity}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, filled * 100)}%` }}
              />
            </div>
            {start && (
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                <LiveDot variant="online" />
                {start > new Date()
                  ? `coup d'envoi dans ${formatDistanceToNowStrict(start, { locale: fr })}`
                  : "en cours"}
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex md:justify-end items-center gap-2 flex-wrap">
            {user?.uid === ev.hostId && (
              <button
                onClick={removeEvent}
                disabled={working}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-red-300 hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                supprimer
              </button>
            )}
            {isJoined ? (
              <button
                onClick={leave}
                disabled={working}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-red-300 hover:bg-red-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                quitter
              </button>
            ) : (
              <button
                onClick={join}
                disabled={isFull || working}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {isFull ? "complet" : "rejoindre"}
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── View switcher (replaces the confusing toggle button) ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="hairline inline-flex items-center rounded-full bg-card p-0.5">
          <button
            onClick={() => setView("participants")}
            className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
              view === "participants"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            participants
          </button>
          <button
            onClick={() => setView("teams")}
            disabled={!canBalance}
            title={!canBalance ? "Il faut au moins 2 participants pour équilibrer" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              view === "teams"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            équipes ia
          </button>
        </div>

        {/* Balance quality badge — only visible in team view */}
        {view === "teams" && canBalance && (
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] ${
              balance.isBalanced
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/20 bg-amber-500/10 text-amber-300"
            }`}
          >
            {balance.isBalanced ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {balance.isBalanced ? "équipes équilibrées" : "équilibrage approximatif"}
          </div>
        )}
      </div>

      {/* ── Content panel ── */}
      {view === "teams" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RosterCard
            label="équipe a"
            mono="A"
            players={teamA}
            score={balance.scoreA}
            accentClass="border-primary/20"
          />
          <RosterCard
            label="équipe b"
            mono="B"
            players={teamB}
            score={balance.scoreB}
            accentClass="border-violet-500/20"
          />
        </div>
      ) : (
        <GlassCard className="p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
            participants · {participants.length}
          </div>
          {participants.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              aucun participant pour l&apos;instant — soyez le premier à rejoindre.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {participants.map((p) => (
                <ParticipantCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CountBlock({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="font-mono text-2xl tabular-nums font-medium">
        {String(v).padStart(2, "0")}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function ParticipantCard({ p }: { p: EventParticipant }) {
  const posKey = p.position ?? "ANY";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="h-7 w-7 shrink-0 rounded-full bg-card grid place-items-center font-mono text-[10px]">
        {p.userName?.charAt(0)?.toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs truncate">{p.userName}</div>
        <div className="mt-0.5 flex items-center gap-1">
          {p.position && p.position !== "ANY" && (
            <span
              className={`rounded border px-1 py-0 font-mono text-[9px] uppercase tracking-wider ${POSITION_COLOR[posKey]}`}
            >
              {POSITION_LABEL[posKey]}
            </span>
          )}
          {p.skillLevel && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {p.skillLevel.slice(0, 3)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RosterCard({
  label,
  mono,
  players,
  score,
  accentClass,
}: {
  label: string;
  mono: string;
  players: EventParticipant[];
  score: number;
  accentClass: string;
}) {
  return (
    <GlassCard className={`p-5 border ${accentClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
            score {score}
          </span>
          <div className="hairline grid h-8 w-8 place-items-center rounded-full bg-card font-mono text-xs font-medium">
            {mono}
          </div>
        </div>
      </div>

      {players.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">aucun joueur assigné.</p>
      ) : (
        <div className="space-y-2">
          {players.map((p) => {
            const posKey = p.position ?? "ANY";
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-card grid place-items-center font-mono text-[10px]">
                    {p.userName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <span className="font-mono text-xs truncate">{p.userName}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.position && p.position !== "ANY" && (
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${POSITION_COLOR[posKey]}`}
                    >
                      {POSITION_LABEL[posKey]}
                    </span>
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {p.skillLevel?.slice(0, 3) ?? "int"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

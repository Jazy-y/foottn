"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trophy,
  Calendar as CalendarIcon,
  MapPin,
  Globe,
  Lock,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { LiveDot } from "@/components/ui/live-dot";
import { useAuth } from "@/contexts/AuthContext";
import { getAllEvents } from "@/services/db";
import type { SportEvent } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export default function EventsPage() {
  const { appUser } = useAuth();
  const canCreate = appUser?.role !== "PLAYER";
  
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live">("upcoming");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getAllEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      const start = toDate(e.startTime);
      const end = toDate(e.endTime);
      if (!start) return false;
      if (filter === "upcoming" && start <= now) return false;
      if (filter === "live" && !(start <= now && end && end >= now))
        return false;
      if (
        query &&
        !e.title.toLowerCase().includes(query.toLowerCase()) &&
        !e.location?.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [events, filter, query]);

  return (
    <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / événements
          </div>
          <h1 className="font-mono text-3xl font-medium">
            <GradientText className="font-medium">tournois & matchs</GradientText>
          </h1>
        </div>
        {canCreate && (
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            créer un événement
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="inline-flex p-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          {(["upcoming", "live", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all ${
                filter === t
                  ? "bg-card text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "upcoming" ? "à venir" : t === "live" ? "en direct" : "tous"}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="rechercher des événements..."
          className="md:flex-1 max-w-sm h-10 bg-white/[0.02] border-white/[0.06] font-mono"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            aucun événement ne correspond au filtre.
          </p>
          {canCreate && (
            <Link
              href="/events/create"
              className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-primary hover:underline"
            >
              en créer un →
            </Link>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((e) => (
            <EventCard key={e.id} ev={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ ev }: { ev: SportEvent }) {
  const start = toDate(ev.startTime);
  const filled = (ev.participantIds?.length ?? 0) / Math.max(1, ev.capacity);
  const live =
    start &&
    new Date() >= start &&
    toDate(ev.endTime) &&
    new Date() <= (toDate(ev.endTime) as Date);

  return (
    <Link href={`/events/${ev.id}`}>
      <GlassCard hover className="p-5 h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="hairline grid h-12 w-12 place-items-center rounded-lg bg-card shrink-0">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
                {ev.visibility === "PUBLIC" ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {ev.visibility.toLowerCase()}
              </div>
              <h3 className="font-mono text-base font-medium truncate">
                {ev.title}
              </h3>
            </div>
          </div>
          {live && (
            <div className="font-mono text-[10px] uppercase tracking-wider rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 inline-flex items-center gap-1.5 shrink-0">
              <LiveDot variant="online" />
              live
            </div>
          )}
        </div>

        <div className="space-y-1 font-mono text-xs text-muted-foreground mb-4">
          <div className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3" />
            {start ? format(start, "EEE MMM dd · HH:mm") : "—"}
          </div>
          {ev.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {ev.location}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>capacité</span>
            <span className="tabular-nums">
              {ev.participantIds?.length ?? 0} / {ev.capacity}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, filled * 100)}%` }}
            />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

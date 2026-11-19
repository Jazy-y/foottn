"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Globe, Lock, ShieldAlert } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createEvent } from "@/services/db";
import type { EventVisibility } from "@/types";
import { toast } from "sonner";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, appUser } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(2);
  const [capacity, setCapacity] = useState(10);
  const [visibility, setVisibility] = useState<EventVisibility>("PUBLIC");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    try {
      const id = await createEvent({
        hostId: user.uid,
        hostName: appUser?.displayName ?? user.email ?? "anon",
        title,
        description,
        location,
        startTime,
        endTime,
        capacity,
        visibility,
      });
      toast.success("Événement programmé");
      router.push(`/events/${id}`);
    } catch {
      toast.error("Échec de la création de l'événement");
    } finally {
      setSubmitting(false);
    }
  };


  // PLAYERs cannot create events — only OWNER and SUPER_ADMIN
  if (appUser && appUser.role === "PLAYER") {
    return (
      <div className="px-4 md:px-8 py-16 max-w-md mx-auto text-center">
        <GlassCard className="p-8 border border-amber-500/20">
          <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="font-mono text-xl font-medium mb-2">Accès refusé</h2>
          <p className="font-mono text-xs text-muted-foreground mb-6">
            Seuls les propriétaires de stades peuvent créer des événements. Rejoignez un événement existant ou contactez un propriétaire.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90"
          >
            ← Voir les événements
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        retour aux événements
      </Link>

      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          / événements · créer
        </div>
        <h1 className="font-mono text-3xl font-medium">
          <GradientText className="font-medium">programmer un match</GradientText>
        </h1>
      </div>

      <GlassCard hairline className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              titre
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Derby du vendredi soir"
              className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="qui, quoi, niveau..."
              className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              lieu
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Stade / complexe"
              className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                coup d&apos;envoi
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                durée · heures
              </label>
              <Input
                type="number"
                min={1}
                max={6}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                className="h-11 bg-white/[0.03] border-white/[0.08] font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                capacité
              </label>
              <Input
                type="number"
                min={2}
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 2)}
                className="h-11 bg-white/[0.03] border-white/[0.08] font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              visibilité
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["PUBLIC", "PRIVATE"] as EventVisibility[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`h-11 rounded-lg font-mono text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 ${
                    visibility === v
                      ? "bg-primary text-primary-foreground"
                      : "border border-white/[0.06] bg-white/[0.02] text-foreground/80 hover:bg-white/[0.04]"
                  }`}
                >
                  {v === "PUBLIC" ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {v.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
            <Link
              href="/events"
              className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              annuler
            </Link>
            <Button
              type="submit"
              disabled={submitting || !title || !date}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "programmer →"
              )}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

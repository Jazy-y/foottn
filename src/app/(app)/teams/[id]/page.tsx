"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Users,
  MessageCircle,
  UserPlus,
  LogOut,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTeamById,
  removeTeamMember,
  addTeamMember,
} from "@/services/db";
import type { Team } from "@/types";
import { toast } from "sonner";

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getTeamById(id)
      .then(setTeam)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
        <GlassCard className="p-8 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            Équipe introuvable.
          </p>
        </GlassCard>
      </div>
    );
  }

  const isMember = !!user && team.memberIds?.includes(user.uid);
  const isCaptain = !!user && team.captainId === user.uid;

  const handleJoin = async () => {
    if (!user || !team.id) return;
    try {
      await addTeamMember(team.id, user.uid);
      setTeam((t) =>
        t ? { ...t, memberIds: [...(t.memberIds ?? []), user.uid] } : t,
      );
      toast.success("Équipe rejointe");
    } catch {
      toast.error("Échec de l'adhésion");
    }
  };

  const handleLeave = async () => {
    if (!user || !team.id) return;
    try {
      await removeTeamMember(team.id, user.uid);
      setTeam((t) =>
        t
          ? {
              ...t,
              memberIds: (t.memberIds ?? []).filter((m) => m !== user.uid),
            }
          : t,
      );
      toast.success("Équipe quittée");
    } catch {
      toast.error("Échec pour quitter");
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        équipes
      </Link>

      <GlassCard hairline className="p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="hairline grid h-16 w-16 place-items-center rounded-xl bg-card font-mono text-xl shrink-0">
              {team.tag ?? team.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
                / équipe · {team.tag ?? team.id?.slice(0, 6)}
              </div>
              <h1 className="font-mono text-3xl font-medium">
                <GradientText className="font-medium">{team.name}</GradientText>
              </h1>
              {team.description && (
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMember && (
              <Link
                href={`/teams/${team.id}/chat`}
                className="hairline inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-card/60 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                discussion
              </Link>
            )}
            {isCaptain && (
              <Link
                href={`/teams/${team.id}/invite`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90"
              >
                <UserPlus className="h-3.5 w-3.5" />
                inviter
              </Link>
            )}
            {!isMember && (
              <button
                onClick={handleJoin}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90"
              >
                <UserPlus className="h-3.5 w-3.5" />
                rejoindre
              </button>
            )}
            {isMember && !isCaptain && (
              <button
                onClick={handleLeave}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-red-300 hover:bg-red-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                quitter
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
          <Users className="h-3.5 w-3.5 text-primary" />
          effectif · {team.memberIds?.length ?? 0}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(team.memberIds ?? []).map((memberId) => (
            <div
              key={memberId}
              className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-card grid place-items-center font-mono text-[10px]">
                  {memberId.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-mono text-sm">
                  {memberId === user?.uid ? "vous" : `joueur_${memberId.slice(0, 6)}`}
                </span>
              </div>
              {memberId === team.captainId && (
                <Crown className="h-4 w-4 text-amber-300" />
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

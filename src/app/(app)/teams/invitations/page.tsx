"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check, X, Loader2, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { useAuth } from "@/contexts/AuthContext";
import { getUserInvites, respondToInvite, addTeamMember } from "@/services/db";
import type { TeamInvite } from "@/types";
import { Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export default function PendingInvitationsPage() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserInvites(user.uid).then(setInvites).finally(() => setLoading(false));
  }, [user]);

  const handleRespond = async (invite: TeamInvite, accept: boolean) => {
    if (!invite.id || !user) return;
    setProcessingId(invite.id);
    try {
      await respondToInvite(invite.id, accept);
      if (accept) {
        await addTeamMember(invite.teamId, user.uid);
        toast.success(`Vous avez rejoint ${invite.teamName} !`);
      } else {
        toast.success("Invitation refusée");
      }
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch {
      toast.error("Erreur lors de la réponse");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
      <Link href="/teams" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-3.5 w-3.5" /> équipes
      </Link>

      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">/ invitations</div>
        <h1 className="font-mono text-3xl font-medium">
          Invitations <GradientText>en attente</GradientText>
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : invites.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">Aucune invitation en attente.</p>
          <Link href="/teams" className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-primary hover:underline">
            explorer les équipes →
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => {
            const date = toDate(invite.createdAt);
            return (
              <GlassCard key={invite.id} className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl border border-white/[0.08] bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold">{invite.teamName}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {date ? `Reçue ${formatDistanceToNow(date, { addSuffix: true, locale: fr })}` : "Récente"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleRespond(invite, false)} disabled={processingId === invite.id}
                      className="h-9 w-9 flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      {processingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleRespond(invite, true)} disabled={processingId === invite.id}
                      className="h-9 px-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors font-mono text-xs uppercase tracking-wider disabled:opacity-50">
                      <Check className="h-4 w-4" /> Accepter
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

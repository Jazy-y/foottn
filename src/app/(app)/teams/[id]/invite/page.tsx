"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Copy, Mail } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createTeamInvite, getTeamById } from "@/services/db";
import type { Team } from "@/types";
import { toast } from "sonner";

export default function TeamInvitePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTeamById(id).then(setTeam);
  }, [id]);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/teams/${id}`
      : "";

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !team || !email.trim()) return;
    setSending(true);
    try {
      await createTeamInvite({
        teamId: id,
        teamName: team.name,
        invitedBy: user.uid,
        email: email.trim(),
      });
      toast.success("Invitation envoyée");
      setEmail("");
    } catch {
      toast.error("Échec de l'envoi de l'invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
      <Link
        href={`/teams/${id}`}
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        retour à l'équipe
      </Link>

      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          / inviter des joueurs
        </div>
        <h1 className="font-mono text-3xl font-medium">
          <GradientText className="font-medium">
            agrandissez {team?.name ?? "votre équipe"}
          </GradientText>
        </h1>
      </div>

      <div className="space-y-6">
        <GlassCard hairline className="p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
            <Mail className="h-3.5 w-3.5 text-primary" />
            inviter par email
          </div>
          <form onSubmit={sendInvite} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@foottn.io"
              className="flex-1 h-11 bg-white/[0.03] border-white/[0.08] font-mono"
              required
            />
            <Button
              type="submit"
              disabled={sending || !email}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
            >
              <Send className="h-3.5 w-3.5 mr-2" /> envoyer
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
            lien partageable
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <code className="flex-1 font-mono text-xs text-foreground/80 truncate">
              {inviteLink}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                toast.success("Copié dans le presse-papiers");
              }}
              className="rounded-md hover:bg-white/[0.05] p-2 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            toute personne disposant de ce lien peut demander à rejoindre.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

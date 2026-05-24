"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createTeam } from "@/services/db";
import { toast } from "sonner";

export default function CreateTeamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const id = await createTeam({
        name,
        tag: tag.toUpperCase().slice(0, 4),
        description,
        captainId: user.uid,
        memberIds: [user.uid],
      });
      toast.success("Équipe déployée");
      router.push(`/teams/${id}`);
    } catch {
      toast.error("Échec de la création de l'équipe");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        retour aux équipes
      </Link>

      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          / équipes · créer
        </div>
        <h1 className="font-mono text-3xl font-medium">
          <GradientText className="font-medium">déployer une escouade</GradientText>
        </h1>
      </div>

      <GlassCard hairline className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              nom de l'équipe
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={32}
              placeholder="Les Avengers"
              className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              tag · 2–4 car
            </label>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="AVG"
              className="h-11 bg-white/[0.03] border-white/[0.08] font-mono uppercase tracking-wider w-32"
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
              maxLength={200}
              placeholder="qui vous êtes, quand vous jouez, ce que vous apportez..."
              className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
            <Link
              href="/teams"
              className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              annuler
            </Link>
            <Button
              type="submit"
              disabled={submitting || !name}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "déployer l'équipe →"
              )}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

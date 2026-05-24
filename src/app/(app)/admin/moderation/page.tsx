"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { getRecentPosts, unflagPost, deletePost } from "@/services/db";
import type { Post } from "@/types";
import { CheckCircle, Trash2, Heart, MessageSquare, Flag, ShieldCheck, Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export default function AdminModerationPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [unflaggedCount, setUnflaggedCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  useEffect(() => {
    getRecentPosts(100)
      .then((v) => setPosts(v.filter((p) => p.flagged)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            / admin · modération
          </div>
          <h1 className="font-mono text-3xl font-medium">
            Modération du <GradientText>Contenu</GradientText>
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Examinez et traitez les publications signalées par la communauté.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Signalements", value: loading ? "—" : posts.length, icon: Flag, color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
            { label: "Ignorés", value: loading ? "—" : unflaggedCount, icon: ShieldCheck, color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Supprimés", value: loading ? "—" : deletedCount, icon: Trash2, color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          ].map((s) => (
            <GlassCard key={s.label} className={`p-4 border ${s.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
              </div>
              <div className="font-mono text-3xl font-semibold tabular-nums">
                {loading ? "—" : s.value}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-mono text-sm text-muted-foreground">Aucune publication signalée — tout est propre ✨</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
          {posts.map((p) => {
            const date = toDate(p.createdAt);
            return (
            <GlassCard key={p.id} className="p-5 flex flex-col gap-4 border-red-500/20">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/10 overflow-hidden shrink-0">
                      {p.authorPhoto ? (
                        <Image src={p.authorPhoto} alt="avatar" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-primary/20 flex items-center justify-center font-mono text-xs text-primary">
                          {p.authorName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-mono text-xs text-foreground/90">{p.authorName}</div>
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        {date ? formatDistanceToNow(date, { addSuffix: true }) : "Date inconnue"}
                      </div>
                    </div>
                  </div>

                  {p.moderationLabel && (
                    <div className="inline-flex flex-col rounded-lg bg-red-500/10 border border-red-500/20 p-3 w-full">
                      <span className="font-mono text-[10px] text-red-400 uppercase tracking-wider mb-1">Raison du signalement</span>
                      <span className="text-sm text-foreground/90">{p.moderationLabel}</span>
                    </div>
                  )}
                  
                  <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl space-y-3">
                    {p.text && <p className="text-sm whitespace-pre-wrap">{p.text}</p>}
                    {p.imageUrl && (
                      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-white/[0.08]">
                        <Image src={p.imageUrl} alt="Contenu signalé" width={600} height={400} className="w-full h-auto object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Heart className="h-3.5 w-3.5" />
                        <span className="font-mono text-[10px]">{p.likes ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="font-mono text-[10px]">{p.comments ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      if (!p.id) return;
                      await unflagPost(p.id);
                      setPosts((cur) => cur.filter((x) => x.id !== p.id));
                      setUnflaggedCount((n) => n + 1);
                    }}
                    className="flex items-center gap-2 p-2 px-4 w-full justify-center text-green-400 bg-green-400/10 hover:bg-green-400/20 rounded-lg transition-colors font-mono text-[10px] uppercase tracking-wider"
                    title="Ignorer le signalement"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Ignorer</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!p.id) return;
                      if (!window.confirm("Supprimer cette publication définitivement ?")) return;
                      await deletePost(p.id);
                      setPosts((cur) => cur.filter((x) => x.id !== p.id));
                      setDeletedCount((n) => n + 1);
                    }}
                    className="flex items-center gap-2 p-2 px-4 w-full justify-center text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors font-mono text-[10px] uppercase tracking-wider"
                    title="Supprimer la publication"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Supprimer</span>
                  </button>
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

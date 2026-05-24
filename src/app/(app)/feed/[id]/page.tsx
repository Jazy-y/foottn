"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, Heart, Loader2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { addComment, getPostComments, getRecentPosts, togglePostLike } from "@/services/db";
import type { Comment, Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

function Avatar({ photo, name, size = 10 }: { photo?: string | null; name?: string | null; size?: number }) {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const dim = `h-${size} w-${size}`;
  if (photo) return <img src={photo} alt={name ?? ""} className={`${dim} rounded-full object-cover ring-2 ring-white/10 shrink-0`} />;
  return (
    <div className={`${dim} rounded-full bg-primary/20 flex items-center justify-center font-mono text-xs font-bold text-primary ring-2 ring-white/10 shrink-0`}>
      {initials}
    </div>
  );
}

export default function FeedDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const posts = await getRecentPosts(200);
      setPost(posts.find((p) => p.id === postId) ?? null);
      setComments(await getPostComments(postId));
      setLoading(false);
    })();
  }, [postId]);

  const onLike = async () => {
    if (!user || !post?.id) return;
    const liked = post.likedBy?.includes(user.uid);
    setPost((p) => p ? {
      ...p,
      likes: Math.max(0, (p.likes ?? 0) + (liked ? -1 : 1)),
      likedBy: liked ? (p.likedBy ?? []).filter((id) => id !== user.uid) : [...(p.likedBy ?? []), user.uid],
    } : p);
    try { await togglePostLike(post.id, user.uid, user.displayName || user.email || undefined); }
    catch { toast.error("Impossible de mettre à jour le j'aime"); }
  };

  const onComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      await addComment(postId, {
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? "Anonyme",
        authorPhoto: user.photoURL ?? "",
        text: text.trim(),
      });
      const newComment: Comment = {
        postId,
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? "Anonyme",
        authorPhoto: user.photoURL ?? "",
        text: text.trim(),
        createdAt: new Date(),
      };
      setComments((v) => [...v, newComment]);
      setPost((p) => p ? { ...p, comments: (p.comments ?? 0) + 1 } : p);
      setText("");
    } catch { toast.error("Impossible d'envoyer le commentaire"); }
    finally { setSending(false); }
  };

  const liked = !!user && post?.likedBy?.includes(user.uid);
  const postDate = toDate(post?.createdAt);

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <Link href="/feed" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> retour au fil
      </Link>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : !post ? (
        <GlassCard className="p-10 text-center">
          <p className="font-mono text-xs text-muted-foreground">Publication introuvable.</p>
        </GlassCard>
      ) : (
        <>
          {/* Post card */}
          <GlassCard hairline className="overflow-hidden">
            <div className="flex items-center gap-3 p-4 pb-3">
              <Avatar photo={post.authorPhoto} name={post.authorName} size={10} />
              <div>
                <div className="font-mono text-sm font-semibold">{post.authorName}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {postDate ? formatDistanceToNow(postDate, { addSuffix: true, locale: fr }) : "—"}
                </div>
              </div>
            </div>

            {post.text && (
              <p className="px-4 pb-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.text}</p>
            )}

            {post.imageUrl && (
              <div className="border-t border-white/[0.06]">
                <Image src={post.imageUrl} alt="post" width={1200} height={700} className="w-full h-auto object-cover max-h-[480px]" />
              </div>
            )}

            {/* Counts */}
            {((post.likes ?? 0) > 0 || (post.comments ?? 0) > 0) && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] font-mono text-[10px] text-muted-foreground">
                {(post.likes ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <Heart className="h-2.5 w-2.5 text-primary fill-primary" />
                    </span>
                    {post.likes}
                  </span>
                )}
                {(post.comments ?? 0) > 0 && (
                  <span className="ml-auto">{post.comments} commentaire{post.comments !== 1 ? "s" : ""}</span>
                )}
              </div>
            )}

            {/* Like button */}
            <div className="border-t border-white/[0.06] px-4">
              <button onClick={onLike}
                className={`flex items-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider rounded-lg transition-all ${
                  liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
                J'aime
              </button>
            </div>
          </GlassCard>

          {/* Comments section */}
          <GlassCard hairline className="overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                commentaires · {comments.length}
              </span>
            </div>

            {/* Comment list */}
            <div className="divide-y divide-white/[0.04]">
              {comments.length === 0 && (
                <p className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">
                  Soyez le premier à commenter !
                </p>
              )}
              {comments.map((c, i) => {
                const cDate = toDate(c.createdAt);
                return (
                  <div key={c.id ?? `${c.authorId}-${i}`} className="flex gap-3 px-4 py-3">
                    <Avatar photo={c.authorPhoto} name={c.authorName} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="inline-block rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.07] px-3 py-2">
                        <div className="font-mono text-xs font-semibold mb-0.5">{c.authorName}</div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{c.text}</p>
                      </div>
                      {cDate && (
                        <div className="font-mono text-[9px] text-muted-foreground/60 mt-1 ml-1">
                          {formatDistanceToNow(cDate, { addSuffix: true, locale: fr })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment input */}
            <div className="border-t border-white/[0.06] p-4">
              <form onSubmit={onComment} className="flex items-center gap-3">
                <Avatar photo={user?.photoURL} name={user?.displayName} size={8} />
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
                <button type="submit" disabled={sending || !text.trim()}
                  className="h-9 w-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Send className="h-4 w-4 text-primary-foreground" />}
                </button>
              </form>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

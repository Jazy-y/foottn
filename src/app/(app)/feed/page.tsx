"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2, Flag, Heart, ImagePlus, Loader2,
  MessageSquare, MoreHorizontal, Send, Trash2, Trophy, X,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  createPost, getRecentPosts, togglePostLike,
  flagPost, updatePost, deletePost,
} from "@/services/db";
import type { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-background shadow-2xl overflow-hidden">
        {children}
      </motion.div>
    </div>
  );
}

// ── Post card ──────────────────────────────────────────────────────────────────
function PostCard({
  post, currentUid,
  onLike, onEdit, onDelete, onFlag,
}: {
  post: Post; currentUid?: string;
  onLike: (p: Post) => void;
  onEdit: (p: Post) => void;
  onDelete: (p: Post) => void;
  onFlag: (p: Post) => void;
}) {
  const liked = !!currentUid && post.likedBy?.includes(currentUid);
  const isOwn = currentUid === post.authorId;
  const date = toDate(post.createdAt);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <GlassCard hairline className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <Avatar photo={post.authorPhoto} name={post.authorName} size={10} />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-semibold truncate">{post.authorName}</div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {date ? formatDistanceToNow(date, { addSuffix: true, locale: fr }) : "—"}
            </div>
          </div>
          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-9 w-44 rounded-xl border border-white/[0.08] bg-background/95 backdrop-blur shadow-xl z-10 overflow-hidden py-1">
                  {isOwn ? (
                    <>
                      <button onClick={() => { onEdit(post); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 font-mono text-xs text-foreground hover:bg-white/[0.06] transition-colors">
                        <Edit2 className="h-3.5 w-3.5" /> Modifier
                      </button>
                      <button onClick={() => { onDelete(post); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 font-mono text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { onFlag(post); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 font-mono text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                      <Flag className="h-3.5 w-3.5" /> Signaler
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Text */}
        {post.text && (
          <p className="px-4 pb-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.text}</p>
        )}

        {/* Image */}
        {post.imageUrl && (
          <div className="border-t border-white/[0.06]">
            <Image src={post.imageUrl} alt="post" width={1200} height={700} className="w-full h-auto object-cover max-h-[480px]" />
          </div>
        )}

        {/* Counts bar */}
        {((post.likes ?? 0) > 0 || (post.comments ?? 0) > 0) && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] font-mono text-[10px] text-muted-foreground">
            {(post.likes ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><Heart className="h-2.5 w-2.5 text-primary fill-primary" /></span>
                {post.likes}
              </span>
            )}
            {(post.comments ?? 0) > 0 && (
              <span className="ml-auto">{post.comments} commentaire{post.comments !== 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center border-t border-white/[0.06] mx-4">
          <button onClick={() => onLike(post)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider rounded-lg transition-all my-1 ${
              liked ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            }`}>
            <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
            J'aime
          </button>
          <Link href={`/feed/${post.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-white/[0.04] hover:text-foreground rounded-lg transition-all my-1">
            <MessageSquare className="h-4 w-4" />
            Commenter
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ── Composer ───────────────────────────────────────────────────────────────────
function Composer({ user, onPost }: { user: ReturnType<typeof useAuth>["user"]; onPost: (p: Post) => void }) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => { setImageFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || (!text.trim() && !imageFile)) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const fd = new FormData(); fd.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error();
        imageUrl = (await res.json()).url;
      }
      const id = await createPost({
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? "Anonyme",
        authorPhoto: user.photoURL ?? "",
        text: text.trim(),
        ...(imageUrl ? { imageUrl } : {}),
      });
      onPost({ id, authorId: user.uid, authorName: user.displayName ?? user.email ?? "Anonyme",
        authorPhoto: user.photoURL ?? "", text: text.trim(), imageUrl,
        likes: 0, likedBy: [], comments: 0, createdAt: new Date() });
      setText(""); clearImage();
      toast.success("Publié !");
    } catch { toast.error("Échec de la publication"); }
    finally { setPosting(false); }
  };

  return (
    <GlassCard hairline className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar photo={user?.photoURL} name={user?.displayName} size={10} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
          placeholder="Partagez les temps forts d'un match, recrutez des joueurs..."
          className="flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
      </div>

      {preview && (
        <div className="relative mb-3 rounded-xl overflow-hidden border border-white/[0.08]">
          <img src={preview} alt="preview" className="w-full max-h-60 object-cover" />
          <button onClick={clearImage} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
          <ImagePlus className="h-4 w-4" />
          Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
        <button onClick={handleSubmit} disabled={posting || (!text.trim() && !imageFile)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Publier
        </button>
      </div>
    </GlassCard>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editText, setEditText] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getRecentPosts(80).then(setPosts).finally(() => setLoading(false));
  }, []);

  const leaderboard = useMemo(() => {
    const score = new Map<string, { name: string; photo?: string; likes: number; posts: number }>();
    for (const p of posts) {
      const prev = score.get(p.authorId) ?? { name: p.authorName, photo: p.authorPhoto, likes: 0, posts: 0 };
      prev.likes += p.likes ?? 0; prev.posts += 1;
      score.set(p.authorId, prev);
    }
    return [...score.values()].sort((a, b) => b.likes - a.likes).slice(0, 5);
  }, [posts]);

  const onLike = async (post: Post) => {
    if (!user || !post.id) return;
    const liked = post.likedBy?.includes(user.uid);
    setPosts((cur) => cur.map((p) => p.id !== post.id ? p : {
      ...p, likes: Math.max(0, (p.likes ?? 0) + (liked ? -1 : 1)),
      likedBy: liked ? (p.likedBy ?? []).filter((id) => id !== user.uid) : [...(p.likedBy ?? []), user.uid],
    }));
    try { await togglePostLike(post.id, user.uid, user.displayName || user.email || undefined); }
    catch { toast.error("Impossible de mettre à jour le j'aime"); }
  };

  const saveEdit = async () => {
    if (!editingPost?.id) return;
    setIsUpdating(true);
    try {
      let imageUrl = editingPost.imageUrl;
      if (editFile) {
        const fd = new FormData(); fd.append("file", editFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error();
        imageUrl = (await res.json()).url;
      }
      const newText = editText.trim();
      await updatePost(editingPost.id, { text: newText, imageUrl });
      setPosts((cur) => cur.map((p) => p.id === editingPost.id ? { ...p, text: newText, imageUrl } : p));
      toast.success("Modifié"); setEditingPost(null); setEditFile(null);
    } catch { toast.error("Échec"); }
    finally { setIsUpdating(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      await deletePost(deleteTarget.id);
      setPosts((cur) => cur.filter((p) => p.id !== deleteTarget.id));
      toast.success("Supprimé"); setDeleteTarget(null);
    } catch { toast.error("Échec"); }
    finally { setIsDeleting(false); }
  };

  const confirmReport = async () => {
    if (!reportingPost?.id || !reportReason.trim()) return;
    setIsReporting(true);
    try {
      await flagPost(reportingPost.id, reportReason.trim());
      toast.success("Signalé"); setReportingPost(null);
    } catch { toast.error("Échec"); }
    finally { setIsReporting(false); }
  };

  return (
    <>
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main feed ── */}
        <section className="lg:col-span-2 space-y-4">
          <Composer user={user} onPost={(p) => setPosts((cur) => [p, ...cur])} />

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <p className="font-mono text-xs text-muted-foreground">Aucune publication pour l'instant. Soyez le premier !</p>
            </GlassCard>
          ) : (
            <AnimatePresence>
              {posts.map((p) => (
                <PostCard key={p.id} post={p} currentUid={user?.uid}
                  onLike={onLike}
                  onEdit={(post) => { setEditingPost(post); setEditText(post.text); }}
                  onDelete={setDeleteTarget}
                  onFlag={(post) => { setReportingPost(post); setReportReason(""); }} />
              ))}
            </AnimatePresence>
          )}
        </section>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <GlassCard hairline className="p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">meilleurs créateurs</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">Aucun classement pour le moment.</p>
            ) : leaderboard.map((u, i) => (
              <div key={`${u.name}-${i}`} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <span className={`font-mono text-xs font-bold w-4 ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <Avatar photo={u.photo} name={u.name} size={8} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs font-semibold truncate">{u.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{u.posts} posts · {u.likes} j'aime</div>
                </div>
              </div>
            ))}
          </GlassCard>
        </aside>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {reportingPost && (
          <Modal onClose={() => setReportingPost(null)}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-base font-semibold">Signaler la publication</h3>
                <button onClick={() => setReportingPost(null)} className="p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Raison du signalement :</p>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={3}
                placeholder="ex: Contenu inapproprié, spam..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-primary/40 mb-4 resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setReportingPost(null)} className="rounded-lg px-4 py-2 font-mono text-xs text-muted-foreground hover:bg-white/[0.04]">Annuler</button>
                <button onClick={confirmReport} disabled={isReporting || !reportReason.trim()}
                  className="rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 font-mono text-xs hover:bg-red-500/20 disabled:opacity-50">
                  {isReporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Signaler"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {editingPost && (
          <Modal onClose={() => { setEditingPost(null); setEditFile(null); }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-base font-semibold">Modifier la publication</h3>
                <button onClick={() => { setEditingPost(null); setEditFile(null); }} className="p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-primary/40 mb-3 resize-none" />
              <label className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-[10px] cursor-pointer mb-4">
                <ImagePlus className="h-3.5 w-3.5" />
                {editFile ? editFile.name : editingPost.imageUrl ? "Remplacer l'image" : "Ajouter une image"}
                <input hidden type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setEditingPost(null); setEditFile(null); }} className="rounded-lg px-4 py-2 font-mono text-xs text-muted-foreground hover:bg-white/[0.04]">Annuler</button>
                <button onClick={saveEdit} disabled={isUpdating}
                  className="rounded-lg bg-primary/10 text-primary border border-primary/20 px-4 py-2 font-mono text-xs hover:bg-primary/20 disabled:opacity-50">
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {deleteTarget && (
          <Modal onClose={() => setDeleteTarget(null)}>
            <div className="p-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="font-mono text-base font-semibold mb-2">Supprimer la publication ?</h3>
              <p className="text-sm text-muted-foreground mb-6">Cette action est irréversible.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeleteTarget(null)} className="rounded-lg px-4 py-2 font-mono text-xs text-muted-foreground hover:bg-white/[0.04]">Annuler</button>
                <button onClick={confirmDelete} disabled={isDeleting}
                  className="rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 font-mono text-xs hover:bg-red-500/20 disabled:opacity-50">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Plus, MapPin, Clock, Trash2, Pencil, Building2,
  TrendingUp, CheckCircle2, AlertCircle, ImageIcon, X, Upload,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { createStadium, deleteStadium, getStadiumsByOwner } from "@/services/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { Stadium } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-start gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
        <div className="font-mono text-2xl font-bold text-foreground">{value}</div>
        {sub && <div className="font-mono text-[10px] text-emerald-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const approved = status === "approved";
  const pending = !status || status === "pending";
  if (approved) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Approuvé
    </span>
  );
  if (pending) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-400">
      <AlertCircle className="h-3 w-3" /> En attente
    </span>
  );
  return null;
}

export default function OwnerStadiumsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Stadium[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("50");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getStadiumsByOwner(user.uid).then(setItems);
  }, [user]);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);
    let imageUrl = "";
    try {
      if (file) {
        imageUrl = await uploadToCloudinary(file, "foottn/stadiums");
      }
      await createStadium({
        ownerId: user.uid, name,
        description: "Owner-managed stadium",
        location, pricePerHour: Number(price),
        features: ["parking"],
        images: imageUrl ? [imageUrl] : [],
      });
      setName(""); setLocation(""); setPrice("50");
      setFile(null); setPreview(null); setShowForm(false);
      setItems(await getStadiumsByOwner(user.uid));
    } catch (err) { console.error(err); }
    finally { setIsUploading(false); }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    await deleteStadium(id);
    if (user) setItems(await getStadiumsByOwner(user.uid));
    setDeletingId(null);
  };

  const approved = items.filter(s => (s as any).status === "approved").length;

  return (
    <AuthGuard requiredRole={["OWNER", "SUPER_ADMIN"]}>
      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400 mb-1">/ mes stades</div>
            <h1 className="font-mono text-3xl font-black tracking-tight text-foreground">Mes Stades</h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">Gérez vos terrains, tarifs et disponibilités.</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Annuler" : "Nouveau stade"}
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Total stades" value={items.length} sub={items.length > 0 ? "terrains enregistrés" : "aucun stade"} color="bg-blue-500/10 border border-blue-500/20 text-blue-400" />
          <StatCard icon={CheckCircle2} label="Approuvés" value={approved} sub="par l'administration" color="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" />
          <StatCard icon={AlertCircle} label="En attente" value={items.length - approved} sub="validation requise" color="bg-amber-500/10 border border-amber-500/20 text-amber-400" />
          <StatCard icon={TrendingUp} label="Prix moyen" value={items.length ? Math.round(items.reduce((a, s) => a + s.pricePerHour, 0) / items.length) + " TND" : "—"} sub="par heure" color="bg-purple-500/10 border border-purple-500/20 text-purple-400" />
        </div>

        {/* ── Create Form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6"
            >
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400 mb-5">+ Nouveau stade</div>
              <form onSubmit={onCreate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nom du stade</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Terrain Al Ahly" required
                      className="rounded-xl border border-white/[0.08] bg-background/60 px-4 py-2.5 font-mono text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Emplacement</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Tunis, Ariana" required
                      className="rounded-xl border border-white/[0.08] bg-background/60 px-4 py-2.5 font-mono text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Prix / heure (TND)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} min={1} required
                      className="rounded-xl border border-white/[0.08] bg-background/60 px-4 py-2.5 font-mono text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">Photo du terrain</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative cursor-pointer rounded-xl border-2 border-dashed border-white/[0.08] hover:border-emerald-500/40 transition-colors bg-background/30 overflow-hidden"
                    style={{ height: preview ? 180 : 100 }}
                  >
                    {preview ? (
                      <Image src={preview} alt="preview" fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="font-mono text-xs">Cliquez pour choisir une image</span>
                      </div>
                    )}
                    {preview && (
                      <button type="button" onClick={e => { e.stopPropagation(); handleFile(null); }}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-black font-bold">
                    <Plus className="h-4 w-4" />
                    {isUploading ? "Enregistrement..." : "Créer le stade"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stadiums Grid ── */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.06] py-20 flex flex-col items-center gap-3 text-muted-foreground">
            <Building2 className="h-10 w-10 opacity-20" />
            <p className="font-mono text-sm">Aucun stade enregistré</p>
            <button onClick={() => setShowForm(true)} className="font-mono text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              + Créer votre premier stade
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {items.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] hover:shadow-[0_0_30px_rgba(0,0,0,0.4)] transition-all"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-white/[0.02]">
                    {s.images?.[0] ? (
                      <Image src={s.images[0]} alt={s.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <StatusBadge status={(s as any).status} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-mono text-base font-bold text-foreground truncate">{s.name}</h3>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />{s.location}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />{s.pricePerHour} TND/h
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link href={`/owner/stadiums/${s.id}/edit`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors">
                        <Pencil className="h-3.5 w-3.5" /> Modifier
                      </Link>
                      <button
                        onClick={() => s.id && onDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-red-300 transition-colors disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === s.id ? "..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

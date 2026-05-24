"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { deleteStadium, getAllStadiumsAdmin, listAllUsers, updateStadium } from "@/services/db";
import type { Stadium } from "@/types";
import { MapPin, Image as ImageIcon, Trash2, User, Calendar, Info, ShieldAlert, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminStadiumsPage() {
  const [items, setItems] = useState<Stadium[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [stadiums, users] = await Promise.all([
        getAllStadiumsAdmin(),
        listAllUsers()
      ]);
      setItems(stadiums);
      const map: Record<string, string> = {};
      users.forEach(u => { map[u.id] = u.displayName || "Unknown User"; });
      setUsersMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
    } catch { return "N/A"; }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    setProcessingId(id);
    try {
      await updateStadium(id, { approved });
      setItems(prev => prev.map(s => s.id === id ? { ...s, approved } : s));
      toast.success(approved ? "Stade approuvé ✅" : "Stade rejeté");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer ce stade ? Cette action est irréversible.")) {
      await deleteStadium(id);
      load();
    }
  };

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">Admin</span> · Gestion des Stades
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="font-mono text-3xl font-medium tracking-tight">
              Tous les <GradientText>Stades</GradientText>
            </h1>
            <div className="font-mono text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              Total: {loading ? "..." : items.length} stades
            </div>
          </div>
        </div>

        {/* Stadiums List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <GlassCard className="p-8 text-center text-muted-foreground">
              Aucun stade n'a été trouvé.
            </GlassCard>
          ) : (
            items.map((s) => (
              <GlassCard key={s.id} className="p-4 flex flex-col md:flex-row gap-5 items-start md:items-center hover:bg-white/[0.02] transition-colors">
                
                {/* Image */}
                <div className="relative w-full md:w-40 h-28 rounded-lg overflow-hidden shrink-0 bg-white/5 flex items-center justify-center border border-white/5">
                  {s.images && s.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.images[0]} alt={s.name} className="object-cover w-full h-full" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-white/20" />
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-medium text-white">{s.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-white/50 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {s.location}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono uppercase tracking-wider border border-emerald-500/20">
                        {s.pricePerHour} TND / hr
                      </span>
                      {s.rating !== undefined && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                          ★ {s.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 font-mono bg-black/20 p-2.5 rounded-lg">
                    <span className="flex items-center gap-1.5" title="Propriétaire">
                      <User className="w-3.5 h-3.5 text-white/50" /> {usersMap[s.ownerId] || s.ownerId.slice(0, 8) + "..."}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-white/50" /> Ajouté le {formatDate(s.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-white/50" /> {s.features?.length || 0} équipements
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="shrink-0 flex items-center md:flex-col justify-end gap-2 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                  {/* Approval status badge */}
                  <div className={`w-full md:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    (s as any).approved === true
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : (s as any).approved === false
                        ? "border-red-500/20 bg-red-500/10 text-red-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  }`}>
                    {(s as any).approved === true ? "Approuvé" : (s as any).approved === false ? "Rejeté" : "En attente"}
                  </div>
                  {/* Approve */}
                  <button
                    onClick={() => s.id && handleApprove(s.id, true)}
                    disabled={processingId === s.id || (s as any).approved === true}
                    className="w-full md:w-10 md:h-10 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors text-emerald-400/80 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider disabled:opacity-40"
                    title="Approuver le stade"
                  >
                    {processingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span className="md:hidden">Approuver</span>
                  </button>
                  {/* Reject */}
                  <button
                    onClick={() => s.id && handleApprove(s.id, false)}
                    disabled={processingId === s.id || (s as any).approved === false}
                    className="w-full md:w-10 md:h-10 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 hover:bg-amber-500/20 hover:text-amber-300 transition-colors text-amber-400/80 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider disabled:opacity-40"
                    title="Rejeter le stade"
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="md:hidden">Rejeter</span>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="w-full md:w-10 md:h-10 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 hover:bg-red-500/20 hover:text-red-300 transition-colors text-red-400/80 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider"
                    title="Supprimer le stade"
                  >
                    <Trash2 className="w-4 h-4" /> <span className="md:hidden">Supprimer</span>
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

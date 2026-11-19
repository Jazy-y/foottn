"use client";

import { toDateValue } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { deleteEvent, getAllEvents } from "@/services/db";
import type { SportEvent } from "@/types";
import { 
  Calendar as CalendarIcon, 
  Trash2,
  User, 
  MapPin, 
  Clock, 
  Users, 
  ShieldAlert, 
  DollarSign 
} from "lucide-react";

export default function AdminEventsPage() {
  const [items, setItems] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch runs from the effect; `load` also shows the spinner on refresh.
  const fetchData = async () => {
    try {
      const events = await getAllEvents();
      // Sort by start time (newest first or upcoming)
      events.sort((a, b) => {
        const tsA = a.startTime as unknown as { toMillis?: () => number };
        const tsB = b.startTime as unknown as { toMillis?: () => number };
        const timeA = tsA?.toMillis ? tsA.toMillis() : new Date(a.startTime as unknown as string).getTime();
        const timeB = tsB?.toMillis ? tsB.toMillis() : new Date(b.startTime as unknown as string).getTime();
        return timeB - timeA;
      });
      setItems(events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    await fetchData();
  };

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, []);

  const formatDate = (date: unknown) => {
    const d = toDateValue(date);
    if (!d) return "N/A";
    try {
      return d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.")) {
      await deleteEvent(id);
      load();
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "LIVE": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "UPCOMING": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "FINISHED": return "bg-white/10 text-white/50 border-white/10";
      case "CANCELLED": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-white/10 text-white/70 border-white/10";
    }
  };

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">Admin</span> · Gestion des Événements
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="font-mono text-3xl font-medium tracking-tight">
              Tous les <GradientText>Événements</GradientText>
            </h1>
            <div className="font-mono text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              Total: {loading ? "..." : items.length} événements
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <GlassCard className="p-8 text-center text-muted-foreground">
              Aucun événement n&apos;a été trouvé.
            </GlassCard>
          ) : (
            items.map((e) => (
              <GlassCard key={e.id} className="p-4 flex flex-col md:flex-row gap-5 items-start md:items-center hover:bg-white/[0.02] transition-colors">
                
                {/* Image */}
                <div className="relative w-full md:w-32 h-24 rounded-lg overflow-hidden shrink-0 bg-white/5 flex items-center justify-center border border-white/5">
                  {e.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.coverImage} alt={e.title} className="object-cover w-full h-full" />
                  ) : (
                    <CalendarIcon className="w-8 h-8 text-white/20" />
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-medium text-white">{e.title}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-white/50 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {e.stadiumName || e.location || "Lieu non spécifié"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider border ${getStatusColor(e.status)}`}>
                        {e.status}
                      </span>
                      {/* Visibility Badge */}
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-white/70 text-xs font-mono uppercase tracking-wider border border-white/10">
                        {e.visibility}
                      </span>
                    </div>
                  </div>
                  
                  {/* Meta / Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 font-mono bg-black/20 p-2.5 rounded-lg">
                    <span className="flex items-center gap-1.5" title="Hôte">
                      <User className="w-3.5 h-3.5 text-white/50" /> {e.hostName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/50" /> {formatDate(e.startTime)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-white/50" /> {e.participantIds?.length || 0} / {e.capacity} places
                    </span>
                    {e.pricePerSeat ? (
                      <span className="flex items-center gap-1.5 text-emerald-400/70">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500/50" /> {e.pricePerSeat} TND
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-white/50">
                        <DollarSign className="w-3.5 h-3.5 text-white/30" /> Gratuit
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="shrink-0 flex items-center md:flex-col justify-end gap-2 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                  <button 
                    onClick={() => handleDelete(e.id)} 
                    className="w-full md:w-10 md:h-10 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 hover:bg-red-500/20 hover:text-red-300 transition-colors text-red-400/80 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider"
                    title="Supprimer l'événement"
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

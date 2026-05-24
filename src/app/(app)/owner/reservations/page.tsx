"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerBookings, updateBookingStatus, createNotification } from "@/services/db";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { CalendarClock, CheckCircle, XCircle } from "lucide-react";

export default function OwnerReservationsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    getOwnerBookings(user.uid).then(setBookings);
  }, [user]);

  const setStatus = async (booking: Booking, status: Booking["status"]) => {
    if (!booking.id) return;
    try {
      await updateBookingStatus(booking.id, status);
      setBookings((v) => v.map((b) => (b.id === booking.id ? { ...b, status } : b)));
      toast.success(status === "CONFIRMED" ? "Réservation approuvée" : "Réservation rejetée");
      
      // Send Notification
      await createNotification({
        userId: booking.userId,
        type: "BOOKING",
        title: status === "CONFIRMED" ? "Réservation Confirmée ✅" : "Réservation Rejetée ❌",
        body: `Votre réservation pour ${booking.stadiumName || "le stade"} a été ${status === "CONFIRMED" ? "approuvée" : "rejetée"}.`,
        href: "/profile"
      });

    } catch (e) {
      toast.error("Erreur de permission ou réseau");
    }
  };

  const toDate = (t: any) => {
    if (t instanceof Timestamp) return t.toDate();
    if (t?.toDate) return t.toDate();
    if (t instanceof Date) return t;
    return new Date();
  };

  return (
    <AuthGuard requiredRole={["OWNER", "SUPER_ADMIN"]}>
      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight uppercase">Mes Réservations</h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">Gérez les demandes de réservation de vos terrains.</p>
        </div>
        
        <div className="space-y-3">
          {bookings.map((b) => {
            const startDate = toDate(b.startTime);
            const endDate = toDate(b.endTime);
            return (
              <GlassCard key={b.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-primary uppercase tracking-wider">{b.stadiumName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${
                      b.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      b.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-primary/70" />
                      <span>{format(startDate, "d MMM yyyy, HH:mm", { locale: fr })} - {format(endDate, "HH:mm")}</span>
                    </div>
                    <div className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
                    <div>
                      Réservé par : <span className="text-foreground">{b.userName}</span>
                    </div>
                    <div className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
                    <div className="font-mono font-bold text-foreground">{b.totalPrice} TND</div>
                  </div>
                </div>
                
                {b.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0 border-t border-white/5 pt-3 md:border-t-0 md:pt-0">
                    <button onClick={() => setStatus(b, "CONFIRMED")} className="flex items-center justify-center gap-2 flex-1 md:flex-none rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Approuver
                    </button>
                    <button onClick={() => setStatus(b, "CANCELLED")} className="flex items-center justify-center gap-2 flex-1 md:flex-none rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-red-300 hover:bg-red-500/20 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  </div>
                )}
              </GlassCard>
            );
          })}
          {bookings.length === 0 && (
            <div className="text-center p-12 text-muted-foreground font-mono text-sm uppercase tracking-wider border border-dashed border-white/10 rounded-2xl">
              Aucune réservation pour le moment.
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

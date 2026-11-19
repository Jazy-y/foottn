"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  QrCode,
  ArrowUpRight,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings, updateBookingStatus } from "@/services/db";
import type { Booking, BookingStatus } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

type Tab = "upcoming" | "past" | "cancelled";

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [qrFor, setQrFor] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserBookings(user.uid)
      .then(setBookings)
      .catch(() => toast.error("Échec du chargement des réservations"))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      const d = toDate(b.startTime);
      if (!d) return false;
      if (tab === "cancelled") return b.status === "CANCELLED";
      if (tab === "past")
        return d < now && b.status !== "CANCELLED";
      return d >= now && b.status !== "CANCELLED";
    });
  }, [bookings, tab]);

  const handleCancel = async (b: Booking) => {
    if (!b.id) return;
    try {
      await updateBookingStatus(b.id, "CANCELLED");
      setBookings((prev) =>
        prev.map((x) =>
          x.id === b.id ? { ...x, status: "CANCELLED" as BookingStatus } : x,
        ),
      );
      toast.success("Réservation annulée");
    } catch {
      toast.error("Échec de l'annulation");
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          / réservations
        </div>
        <h1 className="font-mono text-3xl font-medium">
          <GradientText className="font-medium">vos réservations</GradientText>
        </h1>
      </div>

      <div className="inline-flex p-1 mb-6 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        {(["upcoming", "past", "cancelled"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all ${
              tab === t
                ? "bg-card text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "upcoming" ? "à venir" : t === "past" ? "passées" : "annulées"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            aucune réservation {tab === "upcoming" ? "à venir" : tab === "past" ? "passée" : "annulée"}
          </p>
          <Link
            href="/stadiums"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-primary hover:underline"
          >
            réserver un stade →
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const start = toDate(b.startTime);
            const end = toDate(b.endTime);
            return (
              <GlassCard key={b.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="hairline grid h-12 w-12 place-items-center rounded-lg bg-card shrink-0">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-mono text-base font-medium truncate">
                          {b.stadiumName ?? "Réservation de stade"}
                        </h3>
                        <span
                          className={`font-mono text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : b.status === "CANCELLED"
                              ? "bg-red-500/10 text-red-300 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {b.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {start ? format(start, "EEE MMM dd, yyyy") : "—"}
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {start ? format(start, "HH:mm") : "—"} —{" "}
                          {end ? format(end, "HH:mm") : "—"}
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          stade · {b.stadiumId.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        total
                      </div>
                      <div className="font-mono text-lg tabular-nums">
                        {b.totalPrice.toFixed(2)} TND
                      </div>
                      {b.paymentStatus && (
                        <div className={`font-mono text-[9px] uppercase tracking-wider mt-0.5 ${
                          b.paymentStatus === "PAID" ? "text-emerald-400" : "text-amber-400"
                        }`}>
                          {b.paymentStatus === "PAID" ? "✓ payé" : "non payé"}
                        </div>
                      )}
                    </div>
                    {b.status === "CONFIRMED" && (
                      <button
                        onClick={() => setQrFor(b)}
                        className="hairline rounded-lg bg-card p-2.5 hover:bg-card/60 transition-colors"
                        aria-label="QR ticket"
                      >
                        <QrCode className="h-4 w-4 text-primary" />
                      </button>
                    )}
                    <Link
                      href={`/bookings/${b.id}`}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    {tab === "upcoming" && (
                      <button
                        onClick={() => handleCancel(b)}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 hover:bg-red-500/20 transition-colors text-red-300"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {qrFor && <QRTicketDialog booking={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
}

function QRTicketDialog({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  // Dynamically generate QR data URL on the client.
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = (await import("qrcode")).default;
      const data = JSON.stringify({
        ticket: booking.ticketCode ?? booking.id,
        stadium: booking.stadiumId,
        userId: booking.userId,
      });
      const src = await QR.toDataURL(data, {
        margin: 1,
        width: 320,
        color: { dark: "#10131a", light: "#bff8d2" },
      });
      if (!cancelled) setQrSrc(src);
    })();
    return () => {
      cancelled = true;
    };
  }, [booking]);

  const start = toDate(booking.startTime);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="hairline relative w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-lg p-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            / ticket qr
          </div>
          <h3 className="font-mono text-xl font-medium mb-4">
            {booking.stadiumName ?? "Stade"}
          </h3>
          <div className="rounded-xl bg-white p-4 mb-4">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="QR ticket" className="w-full" />
            ) : (
              <div className="aspect-square animate-pulse bg-zinc-200 rounded-lg" />
            )}
          </div>
          <div className="font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">code</span>
              <span className="tabular-nums">
                {booking.ticketCode ?? booking.id?.slice(0, 8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">quand</span>
              <span>{start ? format(start, "MMM dd, HH:mm") : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">montant</span>
              <span className="tabular-nums">
                {booking.totalPrice.toFixed(2)} TND
              </span>
            </div>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            présentez ce code à l&apos;entrée
          </p>
        </div>
      </div>
    </div>
  );
}

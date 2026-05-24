"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  Download,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveDot } from "@/components/ui/live-dot";
import { getBookingById, getStadiumById } from "@/services/db";
import type { Booking, Stadium } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const b = await getBookingById(id);
        setBooking(b);
        if (b?.stadiumId) {
          const s = await getStadiumById(b.stadiumId);
          setStadium(s);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!booking) return;
    (async () => {
      const QR = (await import("qrcode")).default;
      const src = await QR.toDataURL(
        JSON.stringify({
          ticket: booking.ticketCode ?? booking.id,
          stadium: booking.stadiumId,
        }),
        { margin: 1, width: 280, color: { dark: "#10131a", light: "#bff8d2" } },
      );
      setQrSrc(src);
    })();
  }, [booking]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
        <GlassCard className="p-8 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            Réservation introuvable.
          </p>
          <Link
            href="/bookings"
            className="mt-3 inline-block font-mono text-xs uppercase tracking-wider text-primary"
          >
            retour aux réservations →
          </Link>
        </GlassCard>
      </div>
    );
  }

  const PLATFORM_FEE_RATE = 0.04;
  const start = toDate(booking.startTime);
  const end = toDate(booking.endTime);

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        réservations
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / réservation · {booking.id?.slice(0, 8)}
          </div>
          <h1 className="font-mono text-3xl font-medium">
            <GradientText className="font-medium">
              {stadium?.name ?? "Réservation de stade"}
            </GradientText>
          </h1>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300 inline-flex items-center gap-1.5">
          <LiveDot variant="online" />
          {booking.status.toLowerCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
              détails de la réservation
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailRow
                icon={CalendarIcon}
                label="date"
                value={start ? format(start, "EEE MMM dd, yyyy") : "—"}
              />
              <DetailRow
                icon={Clock}
                label="durée"
                value={
                  start && end
                    ? `${format(start, "HH:mm")} — ${format(end, "HH:mm")}`
                    : "—"
                }
              />
              <DetailRow
                icon={MapPin}
                label="lieu"
                value={stadium?.location ?? "—"}
              />
              <DetailRow
                icon={CreditCard}
                label="paiement"
                value={booking.paymentStatus ?? "UNPAID"}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
              reçu
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">sous-total</span>
                <span className="tabular-nums">
                  {(booking.totalPrice * (1 - PLATFORM_FEE_RATE)).toFixed(2)} TND
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">frais de plateforme · {PLATFORM_FEE_RATE * 100}%</span>
                <span className="tabular-nums">
                  {(booking.totalPrice * PLATFORM_FEE_RATE).toFixed(2)} TND
                </span>
              </div>
              <div className="h-px bg-white/[0.06] my-2" />
              <div className="flex justify-between font-medium">
                <span>total</span>
                <span className="text-primary tabular-nums">
                  {booking.totalPrice.toFixed(2)} TND
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <Link
                href={`/api/invoices/${booking.id}`}
                className="hairline inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-wider hover:bg-card/60 transition-colors"
              >
                <Download className="h-3 w-3" />
                facture pdf
              </Link>
            </div>
          </GlassCard>
        </div>

        <GlassCard hairline className="p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            / billet qr
          </div>
          <div className="rounded-xl bg-white p-4 mb-3">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="QR ticket" className="w-full" />
            ) : (
              <div className="aspect-square animate-pulse bg-zinc-200 rounded-lg" />
            )}
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">code</span>
              <span className="tabular-nums">{booking.ticketCode ?? booking.id?.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center mt-3 text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider">
                valable pour l'entrée
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

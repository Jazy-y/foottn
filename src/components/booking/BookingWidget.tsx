"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Zap,
  Loader2,
  ArrowRight,
  CreditCard,
  FileText,
  X,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Stadium } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { GlassCard } from "@/components/ui/glass-card";
import { LiveDot } from "@/components/ui/live-dot";
import { useAuth } from "@/contexts/AuthContext";
import { createBooking, updateBookingPayment, addWalletTransaction } from "@/services/db";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { authedFetch } from "@/lib/api-client";
import { calculateBookingPrice } from "@/lib/pricing";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let i = 10; i <= 23; i++) {
    slots.push(`${String(i).padStart(2, "0")}:00`);
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();

// ────────────────────────────────────────────────────────────────────
// PDF receipt helper
// ────────────────────────────────────────────────────────────────────
function downloadReceipt(booking: {
  stadiumName: string;
  date: string;
  time: string;
  duration: number;
  total: number;
  ticketCode: string;
  userName: string;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  // Background
  doc.setFillColor(10, 12, 20);
  doc.rect(0, 0, 148, 210, "F");

  // Header bar
  doc.setFillColor(30, 120, 255);
  doc.rect(0, 0, 148, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("FootTN · Reçu de Réservation", 74, 11, { align: "center" });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(125, 211, 252);
  doc.text(booking.stadiumName, 74, 35, { align: "center" });

  // Divider
  doc.setDrawColor(255, 255, 255, 0.1);
  doc.line(14, 42, 134, 42);

  // Body rows
  const rows = [
    ["Date", booking.date],
    ["Horaire", booking.time],
    ["Durée", `${booking.duration}h`],
    ["Client", booking.userName],
    ["Total", `${booking.total.toFixed(2)} TND`],
    ["Code ticket", booking.ticketCode],
    ["Statut", "CONFIRMÉ"],
  ];

  doc.setFontSize(10);
  rows.forEach(([label, value], i) => {
    const y = 52 + i * 12;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(label, 18, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(label === "Total" ? 125 : 226, label === "Total" ? 211 : 232, label === "Total" ? 252 : 240);
    doc.text(value, 130, y, { align: "right" });
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("FootTN · Gestion de Stades Privés · foottn.io", 74, 195, {
    align: "center",
  });

  doc.save(`FootTN_Receipt_${booking.ticketCode}.pdf`);
}

// ────────────────────────────────────────────────────────────────────
// Inner Stripe form
// ────────────────────────────────────────────────────────────────────
function StripePaymentForm({
  bookingId,
  ticketCode,
  stadiumName,
  date,
  time,
  duration,
  total,
  userName,
  onSuccess,
  onCancel,
}: {
  bookingId: string;
  ticketCode: string;
  stadiumName: string;
  date: string;
  time: string;
  duration: number;
  total: number;
  userName: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setErrorMsg("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Paiement échoué");
      setProcessing(false);
      return;
    }

    // Payment succeeded — update Firestore
    try {
      await updateBookingPayment(
        bookingId,
        "PAID",
        "CARD",
        paymentIntent?.id,
      );

      // Download PDF receipt
      downloadReceipt({ stadiumName, date, time, duration, total, ticketCode, userName });

      // Send confirmation email (fire and forget)
      authedFetch("/api/send-booking-email", {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      }).catch(() => {});

      onSuccess();
    } catch {
      toast.error("Erreur lors de la confirmation. Contactez le support.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          paiement sécurisé
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Booking summary */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1 mb-3">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">stade</span>
          <span className="truncate max-w-[150px]">{stadiumName}</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">date · heure</span>
          <span>{date} · {time}</span>
        </div>
        <div className="h-px bg-white/[0.06] my-1" />
        <div className="flex justify-between font-mono text-sm font-medium">
          <span>total</span>
          <span className="text-primary tabular-nums">{total.toFixed(2)} TND</span>
        </div>
      </div>

      <div className="stripe-element-wrapper">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMsg && (
        <p className="font-mono text-xs text-red-400">{errorMsg}</p>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm uppercase tracking-wider"
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            payer {total.toFixed(2)} TND
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        🔒 paiement chiffré · propulsé par Stripe
      </p>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────
// Main widget
// ────────────────────────────────────────────────────────────────────
export function BookingWidget({ stadium }: { stadium: Stadium }) {
  const { user, appUser } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);

  // Flow state — added "choose" step between select and payment
  const [step, setStep] = useState<"select" | "choose" | "payment" | "success">("select");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payingWallet, setPayingWallet] = useState(false);

  // Payment
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string>("");
  const [ticketCode, setTicketCode] = useState<string>("");

  const startHour = selectedSlot ? parseInt(selectedSlot.split(":")[0], 10) : 0;
  const { subtotal, fees, total, isPeak } = calculateBookingPrice(
    stadium.pricePerHour,
    duration,
    startHour,
  );

  const formattedDate = date ? format(date, "dd MMM yyyy") : "—";
  const formattedTime = selectedSlot ?? "—";

  // ── Step 1: go to choose-method screen ─────────────────────────────
  const handleProceedToChoose = async () => {
    if (!user) { toast.error("Veuillez vous connecter pour réserver."); return; }
    if (!date || !selectedSlot) return;
    setIsSubmitting(true);
    const [hours] = selectedSlot.split(":");
    const startTime = new Date(date);
    startTime.setHours(parseInt(hours, 10), 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + duration);
    try {
      // Create the booking as PENDING/UNPAID — method TBD
      const newBookingId = await createBooking({
        stadiumId: stadium.id!,
        stadiumName: stadium.name,
        userId: user.uid,
        startTime,
        endTime,
        totalPrice: total,
        paymentMethod: "PENDING",
      });
      setBookingId(newBookingId);
      const code = `FT-${newBookingId.slice(0, 8).toUpperCase()}`;
      setTicketCode(code);
      setStep("choose");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2a: pay with wallet ────────────────────────────────────────
  const handlePayWithWallet = async () => {
    if (!user) return;
    const balance = appUser?.walletBalance ?? 0;
    if (balance < total) {
      toast.error(`Solde insuffisant. Votre portefeuille: ${balance.toFixed(2)} TND`);
      return;
    }
    setPayingWallet(true);
    try {
      // Debit wallet
      await addWalletTransaction({
        userId: user.uid,
        kind: "BOOKING",
        amount: total,
        description: `Réservation · ${stadium.name}`,
        bookingId,
      });
      // Confirm booking
      await updateBookingPayment(bookingId, "PAID", "WALLET");
      // PDF receipt
      downloadReceipt({
        stadiumName: stadium.name,
        date: formattedDate,
        time: formattedTime,
        duration,
        total,
        ticketCode,
        userName: user?.displayName ?? user?.email ?? "Client",
      });
      toast.success("Paiement par portefeuille confirmé !");
      setStep("success");
    } catch {
      toast.error("Erreur lors du paiement. Réessayez.");
    } finally {
      setPayingWallet(false);
    }
  };

  // ── Step 2b: pay with Stripe ────────────────────────────────────────
  const handlePayWithStripe = async () => {
    setIsSubmitting(true);
    try {
      // The server recomputes the amount from the stored booking.
      const res = await authedFetch("/api/create-payment-intent", {
        method: "POST",
        body: JSON.stringify({ type: "booking", bookingId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Impossible d'initialiser le paiement: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <GlassCard hairline className="p-6 sticky top-24">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="flex flex-col items-center text-center py-8"
        >
          <div className="hairline rounded-full p-5 bg-card mb-5">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h3 className="font-mono text-2xl font-medium mb-1">
            paiement confirmé !
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Votre réservation est confirmée. Un reçu PDF a été téléchargé.
          </p>
          <div className="font-mono text-xs text-muted-foreground mb-6">
            Code ticket:{" "}
            <span className="text-primary font-semibold">{ticketCode}</span>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => {
                downloadReceipt({
                  stadiumName: stadium.name,
                  date: formattedDate,
                  time: formattedTime,
                  duration,
                  total,
                  ticketCode,
                  userName: user?.displayName ?? user?.email ?? "Client",
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-white/[0.04]"
            >
              <FileText className="h-3.5 w-3.5" />
              reçu PDF
            </button>
            <Button
              onClick={() => {
                window.location.href = "/bookings";
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
            >
              Mes réservations →
            </Button>
            <button
              onClick={() => {
                setStep("select");
                setSelectedSlot(null);
                setClientSecret(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-white/[0.04]"
            >
              Nouveau créneau
            </button>
          </div>
        </motion.div>
      </GlassCard>
    );
  }

  // ── Choose payment method screen ──────────────────────────────────
  if (step === "choose") {
    const walletBalance = appUser?.walletBalance ?? 0;
    const canAffordWallet = walletBalance >= total;
    return (
      <GlassCard hairline className="p-0 sticky top-24 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              paiement sécurisé
            </span>
          </div>
          <button
            onClick={() => { setStep("select"); setBookingId(""); setTicketCode(""); }}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Order summary */}
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-xs text-muted-foreground mb-0.5">{stadium.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground/60">{formattedDate} · {formattedTime} · {duration}h</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-xl font-semibold tabular-nums text-primary">{total.toFixed(2)}</div>
              <div className="font-mono text-[10px] text-muted-foreground">TND</div>
            </div>
          </div>
        </div>

        {/* Methods */}
        <div className="p-4 space-y-3">

          {/* ── Wallet ── */}
          <motion.button
            whileHover={canAffordWallet ? { scale: 1.015 } : {}}
            whileTap={canAffordWallet ? { scale: 0.985 } : {}}
            onClick={handlePayWithWallet}
            disabled={payingWallet || isSubmitting || !canAffordWallet}
            className={`w-full rounded-2xl p-4 text-left transition-all relative overflow-hidden ${
              canAffordWallet
                ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.03] border border-emerald-500/25 hover:border-emerald-400/40"
                : "bg-white/[0.02] border border-white/[0.06] cursor-not-allowed"
            }`}
          >
            {/* Glow */}
            {canAffordWallet && (
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent" />
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                canAffordWallet
                  ? "bg-emerald-500/15 border border-emerald-500/30"
                  : "bg-white/[0.04] border border-white/[0.06]"
              }`}>
                {payingWallet
                  ? <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                  : <Wallet className={`h-5 w-5 ${canAffordWallet ? "text-emerald-400" : "text-muted-foreground"}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-semibold">Portefeuille FootTN</div>
                <div className="font-mono text-[10px] text-muted-foreground">Paiement instantané · sans frais</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-mono text-sm font-semibold tabular-nums ${canAffordWallet ? "text-emerald-300" : "text-muted-foreground"}`}>
                  {walletBalance.toFixed(2)}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">TND</div>
              </div>
            </div>

            {canAffordWallet ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/15 px-3 py-2">
                <span className="font-mono text-[10px] text-emerald-300/80">
                  Solde après paiement
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-emerald-300">
                  {(walletBalance - total).toFixed(2)} TND
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/15 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="font-mono text-[10px] text-amber-300/80">
                    Manque {(total - walletBalance).toFixed(2)} TND
                  </span>
                </div>
                <a
                  href="/wallet"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[10px] text-amber-300 underline underline-offset-2 hover:no-underline"
                >
                  Recharger →
                </a>
              </div>
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">ou</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* ── Stripe ── */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={handlePayWithStripe}
            disabled={payingWallet || isSubmitting}
            className="w-full rounded-2xl p-4 text-left bg-gradient-to-br from-primary/10 to-primary/[0.03] border border-primary/25 hover:border-primary/40 transition-all relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
                {isSubmitting
                  ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  : <CreditCard className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-semibold">Carte bancaire</div>
                <div className="font-mono text-[10px] text-muted-foreground">Visa · Mastercard · Apple Pay</div>
              </div>
              <div className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Stripe</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 border border-primary/10 px-3 py-2">
              <span className="text-primary text-xs">🔒</span>
              <span className="font-mono text-[10px] text-muted-foreground">Paiement 100% sécurisé et chiffré</span>
            </div>
          </motion.button>
        </div>
      </GlassCard>
    );
  }

  if (step === "payment" && clientSecret) {
    return (
      <GlassCard hairline className="p-5 sticky top-24">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#7dd3fc",
                colorBackground: "#0a0c14",
                colorText: "#e2e8f0",
                colorDanger: "#f87171",
                fontFamily: "monospace",
                borderRadius: "8px",
              },
            },
          }}
        >
          <StripePaymentForm
            bookingId={bookingId}
            ticketCode={ticketCode}
            stadiumName={stadium.name}
            date={formattedDate}
            time={`${formattedTime} · ${duration}h`}
            duration={duration}
            total={total}
            userName={user?.displayName ?? user?.email ?? "Client"}
            onSuccess={() => setStep("success")}
            onCancel={() => {
              setStep("select");
              setClientSecret(null);
            }}
          />
        </Elements>
      </GlassCard>
    );
  }

  return (
    <GlassCard hairline className="p-5 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <LiveDot variant="online" />
          réserver un créneau
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 inline-flex items-center gap-1">
          <Zap className="h-3 w-3" />
          instantané
        </div>
      </div>

      <div className="font-mono">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-medium tabular-nums">
            {stadium.pricePerHour} TND
          </span>
          <span className="text-xs text-muted-foreground">/ heure de base</span>
        </div>
      </div>

      <div className="my-5 h-px bg-white/[0.06]" />

      {/* Date */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <CalendarIcon className="h-3 w-3" />
          sélectionner la date
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </div>
      </div>

      {/* Time slots */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <Clock className="h-3 w-3" />
            créneaux disponibles
          </div>
          {isPeak && (
            <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5">
              pointe +20%
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {TIME_SLOTS.map((slot) => {
            const peak = parseInt(slot.split(":")[0], 10) >= 18;
            const isSel = selectedSlot === slot;
            return (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`relative h-9 rounded-md font-mono text-xs tabular-nums transition-all ${
                  isSel
                    ? "bg-primary text-primary-foreground"
                    : "border border-white/[0.06] bg-white/[0.02] text-foreground/80 hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
              >
                {slot}
                {peak && !isSel && (
                  <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2 mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          durée
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((h) => (
            <button
              key={h}
              onClick={() => setDuration(h)}
              className={`h-9 rounded-md font-mono text-xs uppercase tracking-wider transition-all ${
                duration === h
                  ? "bg-primary text-primary-foreground"
                  : "border border-white/[0.06] bg-white/[0.02] text-foreground/80 hover:bg-white/[0.04]"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1.5 mb-5">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">date</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">heure</span>
          <span>{formattedTime} · {duration}h</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">sous-total</span>
          <span className="tabular-nums">{subtotal.toFixed(2)} TND</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">frais de plateforme · 4%</span>
          <span className="tabular-nums">{fees.toFixed(2)} TND</span>
        </div>
        <div className="h-px bg-white/[0.06] my-1.5" />
        <div className="flex justify-between font-mono text-sm">
          <span>total</span>
          <span className="text-primary tabular-nums font-medium">
            {total.toFixed(2)} TND
          </span>
        </div>
      </div>

      <Button
        onClick={handleProceedToChoose}
        disabled={!date || !selectedSlot || isSubmitting}
        className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm uppercase tracking-wider"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            choisir le paiement
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        🔒 paiement sécurisé · annulation gratuite 12h avant
      </p>
    </GlassCard>
  );
}

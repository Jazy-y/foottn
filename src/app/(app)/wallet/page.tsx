"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, ArrowDownLeft, ArrowUpRight,
  CreditCard, Loader2, CheckCircle2,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { authedFetch } from "@/lib/api-client";
import { WALLET_TOPUP_MAX, WALLET_TOPUP_MIN } from "@/lib/pricing";

const isValidTopUp = (amount: number) =>
  Number.isFinite(amount) && amount >= WALLET_TOPUP_MIN && amount <= WALLET_TOPUP_MAX;
import { addWalletTransaction, getUserWalletTx } from "@/services/db";
import type { WalletTransaction } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);



function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  if (typeof t === "object" && "toDate" in t && typeof t.toDate === "function") {
    return (t as { toDate: () => Date }).toDate();
  }
  return null;
}

// ── Stripe checkout form ─────────────────────────────────────────────
function CheckoutForm({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });
      if (error) {
        toast.error(error.message ?? "Erreur de paiement");
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        onSuccess();
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
        / paiement sécurisé · {amount} TND
      </div>
      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: { name: "auto" } },
        }}
      />
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-white/[0.08] bg-white/[0.02] text-foreground hover:bg-white/[0.05] font-mono text-xs uppercase tracking-wider"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `Recharger ${amount} TND →`
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Main wallet page ─────────────────────────────────────────────────
export default function WalletPage() {
  const { user, appUser } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // Top-up flow state
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const balance = appUser?.walletBalance ?? 0;
  const totalSpent = transactions
    .filter((t) => t.kind === "BOOKING")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReloaded = transactions
    .filter((t) => t.kind === "TOPUP")
    .reduce((sum, t) => sum + t.amount, 0);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setTransactions(await getUserWalletTx(user.uid));
    } finally {
      setLoadingTx(false);
    }
  };

  const loadTransactions = async () => {
    setLoadingTx(true);
    await fetchTransactions();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the user changes
  useEffect(() => { fetchTransactions(); }, [user]);

  const handleSelectAmount = async (amount: number) => {
    setSelectedAmount(amount);
    setLoadingIntent(true);
    try {
      const res = await authedFetch("/api/create-payment-intent", {
        method: "POST",
        body: JSON.stringify({ amount, type: "wallet_topup" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientSecret(data.clientSecret);
    } catch {
      toast.error("Impossible d'initialiser le paiement");
      setSelectedAmount(null);
    } finally {
      setLoadingIntent(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!user || !selectedAmount) return;
    try {
      await addWalletTransaction({
        userId: user.uid,
        kind: "TOPUP",
        amount: selectedAmount,
        description: `Recharge Stripe · ${selectedAmount} TND`,
      });
      toast.success(`✅ ${selectedAmount} TND ajoutés à votre portefeuille !`);
      setSucceeded(true);
      await loadTransactions();
      setTimeout(() => {
        setSucceeded(false);
        setSelectedAmount(null);
        setClientSecret(null);
      }, 2500);
    } catch {
      toast.error("Erreur lors de l'ajout au portefeuille");
    }
  };

  const handleCancel = () => {
    setSelectedAmount(null);
    setClientSecret(null);
  };

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "night" as const,
          variables: { colorPrimary: "#22d3ee", borderRadius: "8px" },
        },
      }
    : undefined;

  return (
    <AuthGuard>
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            / portefeuille
          </div>
          <h1 className="font-mono text-3xl font-medium">
            Mon <GradientText>Portefeuille</GradientText>
          </h1>
        </div>

        {/* Balance + KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-5 sm:col-span-1 border border-primary/20 bg-primary/5">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Wallet className="h-3 w-3 text-primary" /> Solde actuel
            </div>
            <div className="font-mono text-4xl font-semibold tabular-nums mt-1">
              {balance.toFixed(2)}
              <span className="text-lg text-muted-foreground ml-1">TND</span>
            </div>
          </GlassCard>
          <GlassCard className="p-5 border border-emerald-500/15">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <ArrowDownLeft className="h-3 w-3 text-emerald-400" /> Total rechargé
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums text-emerald-300 mt-1">
              {totalReloaded.toFixed(2)} TND
            </div>
          </GlassCard>
          <GlassCard className="p-5 border border-red-500/15">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <ArrowUpRight className="h-3 w-3 text-red-400" /> Total dépensé
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums text-red-300 mt-1">
              {totalSpent.toFixed(2)} TND
            </div>
          </GlassCard>
        </div>

        {/* Top-up section */}
        <GlassCard className="p-6">
          <AnimatePresence mode="wait">
            {succeeded ? (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="hairline rounded-full p-4 bg-card mb-4">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-mono text-xl font-medium">Recharge confirmée !</h3>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {selectedAmount} TND ont été ajoutés à votre portefeuille.
                </p>
              </motion.div>
            ) : clientSecret && selectedAmount ? (
              <motion.div key="stripe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <CheckoutForm
                    amount={selectedAmount}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handleCancel}
                  />
                </Elements>
              </motion.div>
            ) : loadingIntent ? (
              <motion.div key="loading" className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Initialisation du paiement…
                </p>
              </motion.div>
            ) : (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-medium">Recharger via Stripe</div>
                    <div className="font-mono text-[10px] text-muted-foreground">Visa · Mastercard · Apple Pay</div>
                  </div>
                </div>

                {/* Custom amount input */}
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Montant à recharger (TND)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={WALLET_TOPUP_MIN}
                      max={WALLET_TOPUP_MAX}
                      step={1}
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full h-14 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-primary/40 focus:outline-none px-4 font-mono text-2xl tabular-nums text-foreground placeholder:text-muted-foreground/40 pr-20 transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                      TND
                    </div>
                  </div>
                  {customAmount && parseFloat(customAmount) < WALLET_TOPUP_MIN && (
                    <p className="font-mono text-[10px] text-amber-300">Montant minimum : {WALLET_TOPUP_MIN} TND</p>
                  )}
                  {customAmount && parseFloat(customAmount) > WALLET_TOPUP_MAX && (
                    <p className="font-mono text-[10px] text-amber-300">Montant maximum : {WALLET_TOPUP_MAX} TND</p>
                  )}
                </div>

                {/* Quick picks */}
                <div className="flex gap-2 flex-wrap">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCustomAmount(String(amt))}
                      className={`h-8 px-3 rounded-lg font-mono text-xs transition-all border ${
                        customAmount === String(amt)
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:border-white/[0.12]"
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                {/* Pay button */}
                <button
                  onClick={() => {
                    const amt = parseFloat(customAmount);
                    if (isValidTopUp(amt)) handleSelectAmount(amt);
                  }}
                  disabled={!isValidTopUp(parseFloat(customAmount))}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-mono text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Recharger {isValidTopUp(parseFloat(customAmount)) ? `${parseFloat(customAmount).toFixed(2)} TND` : ""}
                </button>

                <p className="font-mono text-[10px] text-muted-foreground/50 text-center">
                  🔒 Paiement sécurisé et chiffré via Stripe
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Transaction history */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            / historique des transactions
          </div>
          {loadingTx ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="font-mono text-xs text-muted-foreground">Aucune transaction pour le moment.</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const date = toDate(tx.createdAt);
                const isTopup = tx.kind === "TOPUP";
                return (
                  <GlassCard key={tx.id} className="p-4 flex items-center gap-4">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isTopup ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"
                    }`}>
                      {isTopup
                        ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                        : <ArrowUpRight className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">{tx.description}</div>
                      {date && (
                        <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          {format(date, "dd MMM yyyy · HH:mm", { locale: fr })}
                        </div>
                      )}
                    </div>
                    <div className={`font-mono text-sm font-semibold tabular-nums shrink-0 ${
                      isTopup ? "text-emerald-300" : "text-red-300"
                    }`}>
                      {isTopup ? "+" : "-"}{tx.amount.toFixed(2)} TND
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AuthGuard>
  );
}

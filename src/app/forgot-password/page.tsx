"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      if (msg.includes("user-not-found")) {
        setError("Aucun compte trouvé avec cet email.");
      } else {
        setError("Échec de l'envoi. Vérifiez l'adresse email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            retour à la connexion
          </Link>

          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              / récupération
            </div>
            <h1 className="font-mono text-3xl font-medium">
              <GradientText className="font-medium">Mot de passe</GradientText>{" "}
              oublié
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entrez votre email et nous vous enverrons un lien de
              réinitialisation.
            </p>
          </div>

          <GlassCard hairline className="p-6">
            {sent ? (
              <div className="text-center py-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="font-mono text-base font-semibold mb-2">
                  Email envoyé !
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Vérifiez votre boîte mail{" "}
                  <span className="text-foreground font-mono">{email}</span> et
                  suivez le lien pour réinitialiser votre mot de passe.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="font-mono text-xs uppercase tracking-wider text-primary hover:underline"
                >
                  Renvoyer un email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="pl-9 h-11 bg-white/[0.02] border-white/[0.08] font-mono"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="font-mono text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-11 rounded-xl bg-primary font-mono text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Envoyer le lien de réinitialisation
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

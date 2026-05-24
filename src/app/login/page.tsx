"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { LiveDot } from "@/components/ui/live-dot";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Authentifié");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la connexion",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success("Authentifié via Google");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la connexion avec Google",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-mono text-xs uppercase tracking-wider"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        retour
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link
            href="/"
            className="hairline inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            FOOTTN auth
          </Link>
          <h1 className="mt-6 font-mono text-3xl font-medium tracking-tight">
            <GradientText className="font-medium">Bon retour</GradientText>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Authentifiez-vous pour accéder à votre console FootTN.
          </p>
        </div>

        <GlassCard hairline className="p-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-sm hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            continuer avec google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              ou
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                email
              </label>
              <Input
                type="email"
                placeholder="player@foottn.io"
                className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                mot de passe
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "S'authentifier →"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-2">
              <LiveDot variant="online" />
              statut: en ligne
            </span>
            <Link
              href="/register"
              className="uppercase tracking-wider hover:text-foreground transition-colors"
            >
              nouveau compte →
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

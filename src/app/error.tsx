"use client";

import Link from "next/link";
import { useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <GlassCard hairline className="p-10 max-w-md w-full text-center">
        <div className="hairline inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-amber-300" />
          statut: rejeté
        </div>
        <h1 className="mt-6 font-mono text-3xl font-medium">
          <GradientText className="font-medium">erreur inattendue</GradientText>
        </h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground break-words">
          {error?.message ?? "Quelque chose a explosé."}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90"
          >
            réessayer
          </button>
          <Link
            href="/"
            className="hairline rounded-full bg-card px-5 py-2.5 font-mono text-xs uppercase tracking-wider hover:bg-card/60"
          >
            accueil
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

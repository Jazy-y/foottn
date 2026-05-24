import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <GlassCard hairline className="p-10 max-w-md w-full text-center">
        <div className="hairline inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          statut: 404
        </div>
        <h1 className="mt-6 font-mono text-5xl font-medium tabular-nums">
          <GradientText className="font-medium">404</GradientText>
        </h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          cette route ne fait pas partie du protocole.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90"
        >
          retour à l'accueil →
        </Link>
      </GlassCard>
    </div>
  );
}

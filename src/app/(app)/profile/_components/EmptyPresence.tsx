import type { ReactNode } from "react";
import Link from "next/link";

interface EmptyPresenceProps {
  icon: ReactNode;
  label: string;
  hint: string;
  cta?: { label: string; href: string };
}

export function EmptyPresence({ icon, label, hint, cta }: EmptyPresenceProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-mono text-xs font-medium text-foreground/70">{label}</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{hint}</p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
}

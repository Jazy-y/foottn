import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          loading protocol…
        </span>
      </div>
    </div>
  );
}

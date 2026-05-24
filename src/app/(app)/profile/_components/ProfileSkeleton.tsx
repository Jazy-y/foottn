import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Identity header */}
      <GlassCard hairline className="p-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64 rounded-md" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Health strip */}
      <GlassCard className="px-6 py-4">
        <div className="flex items-center gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24 rounded-md" />
          ))}
        </div>
      </GlassCard>

      {/* Presence tiles */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassCard key={i} className="p-5">
            <Skeleton className="h-3 w-16 rounded-md mb-3" />
            <Skeleton className="h-8 w-12 rounded-md" />
          </GlassCard>
        ))}
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <GlassCard key={i} className="p-6 space-y-4">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { Role } from "@/types";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
}) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    if (requiredRole) {
      const allowed = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];
      if (appUser && !allowed.includes(appUser.role)) {
        router.replace("/dashboard");
      }
    }
  }, [user, appUser, loading, pathname, router, requiredRole]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-xs uppercase tracking-wider">
          <Loader2 className="h-4 w-4 animate-spin" />
          authenticating…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

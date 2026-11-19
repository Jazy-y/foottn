"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Trophy, MessageSquare,
  Wallet, Building2, BarChart3, Shield, User,
  LifeBuoy, X, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { GradientText } from "@/components/ui/gradient-text";

type Item = { label: string; href: string; icon: React.ElementType };

const playerLinks: Item[] = [
  { label: "Console",      href: "/dashboard",  icon: LayoutDashboard },
  { label: "Réservations", href: "/bookings",   icon: Calendar        },
  { label: "Équipes",      href: "/teams",      icon: Users           },
  { label: "Événements",   href: "/events",     icon: Trophy          },
  { label: "Fil d'actu",   href: "/feed",       icon: MessageSquare   },
  { label: "Portefeuille", href: "/wallet",     icon: Wallet          },
];
const ownerLinks: Item[] = [
  { label: "Console",      href: "/owner",               icon: LayoutDashboard },
  { label: "Stades",       href: "/owner/stadiums",      icon: Building2       },
  { label: "Réservations", href: "/owner/reservations",  icon: Calendar        },
  { label: "Analyses",     href: "/owner/analytics",     icon: BarChart3       },
];
const adminLinks: Item[] = [
  { label: "Console",       href: "/admin",             icon: LayoutDashboard },
  { label: "Utilisateurs",  href: "/admin/users",       icon: Users           },
  { label: "Stades",        href: "/admin/stadiums",    icon: Building2       },
  { label: "Événements",    href: "/admin/events",      icon: Trophy          },
  { label: "Équipes",       href: "/admin/teams",       icon: Users           },
  { label: "Tickets",       href: "/admin/tickets",     icon: MessageSquare   },
  { label: "Modération",    href: "/admin/moderation",  icon: Shield          },
  { label: "Analyses",      href: "/admin/analytics",   icon: BarChart3       },
];
const bottomLinks: Item[] = [
  { label: "Profil",        href: "/profile",   icon: User     },
  { label: "Support",       href: "/support",   icon: LifeBuoy },
];

function getLinks(role: string | null | undefined): Item[] {
  if (role === "SUPER_ADMIN") return adminLinks;
  if (role === "OWNER")       return ownerLinks;
  return playerLinks;
}

// ── Mobile drawer ────────────────────────────────────────────────────
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { appUser } = useAuth();
  const links = getLinks(appUser?.role);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-white/[0.06] bg-sidebar/95 backdrop-blur-2xl"
          >
            {/* Logo + close */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
              <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                <div className="hairline grid h-8 w-8 place-items-center rounded-lg bg-card">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <GradientText as="span" className="font-mono text-sm font-semibold tracking-tight">
                  FOOTTN
                </GradientText>
              </Link>
              <button
                onClick={onClose}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
              <div className="space-y-0.5">
                <div className="px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
                  navigation
                </div>
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs transition-colors",
                      (pathname === item.href || pathname?.startsWith(item.href + "/"))
                        ? "bg-white/[0.05] text-foreground border border-white/[0.06]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 uppercase tracking-wider">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="space-y-0.5">
                <div className="px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
                  compte
                </div>
                {bottomLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs transition-colors",
                      pathname === item.href
                        ? "bg-white/[0.05] text-foreground border border-white/[0.06]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 uppercase tracking-wider">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Footer role badge */}
            <div className="border-t border-white/[0.06] p-3">
              <div className="hairline rounded-lg bg-card p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {appUser?.role ?? "JOUEUR"} tier
                </div>
                <div className="mt-1 font-mono text-xs">{appUser?.displayName ?? "—"}</div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Trophy,
  MessageSquare,
  Wallet,
  LifeBuoy,
  User,
  BarChart3,
  Building2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { LiveDot } from "@/components/ui/live-dot";
import type { Role } from "@/types";

type Item = { label: string; href: string; icon: React.ElementType };

const playerLinks: Item[] = [
  { label: "Console", href: "/dashboard", icon: LayoutDashboard },
  { label: "Réservations", href: "/bookings", icon: Calendar },
  { label: "Équipes", href: "/teams", icon: Users },
  { label: "Événements", href: "/events", icon: Trophy },
  { label: "Fil d'actu", href: "/feed", icon: MessageSquare },
  { label: "Portefeuille", href: "/wallet", icon: Wallet },
];

const ownerLinks: Item[] = [
  { label: "Console", href: "/owner", icon: LayoutDashboard },
  { label: "Stades", href: "/owner/stadiums", icon: Building2 },
  { label: "Réservations", href: "/owner/reservations", icon: Calendar },
  { label: "Analyses", href: "/owner/analytics", icon: BarChart3 },
];

const adminLinks: Item[] = [
  { label: "Console", href: "/admin", icon: LayoutDashboard },
  { label: "Utilisateurs", href: "/admin/users", icon: Users },
  { label: "Stades", href: "/admin/stadiums", icon: Building2 },
  { label: "Événements", href: "/admin/events", icon: Trophy },
  { label: "Équipes", href: "/admin/teams", icon: Users },
  { label: "Tickets", href: "/admin/tickets", icon: MessageSquare },
  { label: "Modération", href: "/admin/moderation", icon: Shield },
  { label: "Analyses", href: "/admin/analytics", icon: BarChart3 },
];

const bottomLinks: Item[] = [
  { label: "Profil", href: "/profile", icon: User },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

function getLinksForRole(role: Role | null): Item[] {
  if (role === "SUPER_ADMIN") return adminLinks;
  if (role === "OWNER") return ownerLinks;
  return playerLinks;
}

export function Sidebar() {
  const pathname = usePathname();
  const { appUser } = useAuth();
  const links = getLinksForRole(appUser?.role ?? null);

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 sticky top-0 h-screen border-r border-white/[0.06] bg-sidebar/60 backdrop-blur-xl">
      <Link
        href="/"
        className="flex items-center gap-0 px-4 h-16 border-b border-white/[0.06]"
      >
        <Image
          src="/logo2.png"
          alt="FootTN"
          width={55}
          height={55}
          className="object-contain shrink-0"
          priority
        />
        <div className="flex flex-col leading-none gap-0.5 -ml-3">
          <span className="font-mono text-lg font-black tracking-tight leading-none">
            <span className="text-foreground">OO</span>
            <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TT</span>
            <span className="text-foreground">N</span>
          </span>
          <span className="font-mono text-[8px] font-semibold tracking-[0.2em] uppercase text-emerald-400">
            Stade · Équipe · Passion
          </span>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 space-y-0.5">
        <SidebarSection label="navigation">
          {links.map((item) => (
            <SidebarLink
              key={item.href}
              {...item}
              active={pathname === item.href || pathname?.startsWith(item.href + "/")}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="compte" className="mt-6">
          {bottomLinks.map((item) => (
            <SidebarLink
              key={item.href}
              {...item}
              active={pathname === item.href || pathname?.startsWith(item.href + "/")}
            />
          ))}
        </SidebarSection>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="hairline rounded-lg bg-card p-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <LiveDot variant="online" />
            {appUser?.role ?? "JOUEUR"} tier
          </div>
          <div className="mt-1 font-mono text-xs">
            {appUser?.displayName ?? "Connecter le compte"}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
        {label}
      </div>
      {children}
    </div>
  );
}

function SidebarLink({
  label,
  href,
  icon: Icon,
  active,
}: Item & { active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs transition-colors",
        active
          ? "bg-white/[0.05] text-foreground border border-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 uppercase tracking-wider">{label}</span>
      {active && <span className="h-1 w-1 rounded-full bg-primary" />}
    </Link>
  );
}

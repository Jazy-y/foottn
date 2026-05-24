"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  BarChart3,
  Calendar,
  LayoutGrid,
  MessageSquare,
  Shield,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/admin/analytics",
    label: "Analytiques",
    description: "Statistiques de la plateforme en temps réel",
    icon: BarChart3,
    accent: "from-blue-500/20 to-cyan-500/10",
    iconColor: "text-blue-400",
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    description: "Gérer les comptes et les rôles",
    icon: Users,
    accent: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
  },
  {
    href: "/admin/stadiums",
    label: "Stades",
    description: "Superviser les stades enregistrés",
    icon: LayoutGrid,
    accent: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
  },
  {
    href: "/admin/events",
    label: "Événements",
    description: "Gérer les événements sportifs",
    icon: Calendar,
    accent: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
  },
  {
    href: "/admin/moderation",
    label: "Modération",
    description: "Contenu signalé et modération",
    icon: Shield,
    accent: "from-red-500/20 to-rose-500/10",
    iconColor: "text-red-400",
  },
  {
    href: "/admin/tickets",
    label: "Tickets Support",
    description: "Tickets des utilisateurs à traiter",
    icon: MessageSquare,
    accent: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
  },
  {
    href: "/admin/teams",
    label: "Équipes",
    description: "Superviser et modérer les équipes",
    icon: Shield,
    accent: "from-cyan-500/20 to-teal-500/10",
    iconColor: "text-cyan-400",
  },
];

export default function AdminConsolePage() {
  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            / super administrateur
          </div>
          <h1 className="font-mono text-3xl font-medium">
            <GradientText className="font-medium">console admin</GradientText>
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            Gérez l'ensemble de la plateforme FootTN depuis ce tableau de bord.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NAV_ITEMS.map(({ href, label, description, icon: Icon, accent, iconColor }) => (
            <Link key={href} href={href}>
              <GlassCard
                hairline
                className={`p-5 h-full hover:bg-white/[0.04] transition-all bg-gradient-to-br ${accent} group`}
              >
                <div className={`h-10 w-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-mono text-sm font-semibold mb-1">{label}</div>
                <div className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                  {description}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}

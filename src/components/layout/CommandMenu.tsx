"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Calendar,
  Users,
  Trophy,
  MessageSquare,
  Wallet,
  User as UserIcon,
  LayoutDashboard,
  Building2,
  BarChart3,
  LifeBuoy,
  Shield,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Kbd } from "@/components/ui/kbd";

type CommandMenuContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

export function useCommandMenu() {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) throw new Error("useCommandMenu must be inside CommandMenuProvider");
  return ctx;
}

type CmdItem = { group: string; icon: React.ElementType; label: string; href: string };

const commonItems: CmdItem[] = [
  { group: "Compte", icon: UserIcon, label: "Profil", href: "/profile" },
  { group: "Compte", icon: LifeBuoy, label: "Support", href: "/support" },
  { group: "Découvrir", icon: Building2, label: "Parcourir les stades", href: "/stadiums" },
];

const playerItems: CmdItem[] = [
  { group: "Naviguer", icon: LayoutDashboard, label: "Console", href: "/dashboard" },
  { group: "Naviguer", icon: Calendar, label: "Mes réservations", href: "/bookings" },
  { group: "Naviguer", icon: Users, label: "Équipes", href: "/teams" },
  { group: "Naviguer", icon: Trophy, label: "Événements", href: "/events" },
  { group: "Naviguer", icon: MessageSquare, label: "Fil d'actu", href: "/feed" },
  { group: "Naviguer", icon: Wallet, label: "Portefeuille", href: "/wallet" },
];

const ownerItems: CmdItem[] = [
  { group: "Propriétaire", icon: LayoutDashboard, label: "Console", href: "/owner" },
  { group: "Propriétaire", icon: Building2, label: "Mes stades", href: "/owner/stadiums" },
  { group: "Propriétaire", icon: Calendar, label: "Réservations", href: "/owner/reservations" },
  { group: "Propriétaire", icon: BarChart3, label: "Analyses", href: "/owner/analytics" },
];

const adminItems: CmdItem[] = [
  { group: "Admin", icon: LayoutDashboard, label: "Console Admin", href: "/admin" },
  { group: "Admin", icon: Users, label: "Utilisateurs", href: "/admin/users" },
  { group: "Admin", icon: Building2, label: "Stades", href: "/admin/stadiums" },
  { group: "Admin", icon: Trophy, label: "Événements", href: "/admin/events" },
  { group: "Admin", icon: MessageSquare, label: "Tickets Support", href: "/admin/tickets" },
  { group: "Admin", icon: Shield, label: "Modération", href: "/admin/moderation" },
  { group: "Admin", icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
];

function getItemsByRole(role: string | null | undefined): CmdItem[] {
  if (role === "SUPER_ADMIN") return [...adminItems, ...commonItems];
  if (role === "OWNER")       return [...ownerItems, ...commonItems];
  return [...playerItems, ...commonItems];
}

export function CommandMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { appUser } = useAuth();

  const items = getItemsByRole(appUser?.role);
  const groups = Array.from(new Set(items.map((i) => i.group)));

  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsOpen(false);
    router.push("/");
  };

  return (
    <CommandMenuContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="hairline relative w-full max-w-xl rounded-xl bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <Command label="Command Menu" className="text-foreground">
              <div className="flex items-center gap-2 px-4 h-12 border-b border-white/[0.06]">
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  /
                </span>
                <Command.Input
                  placeholder="rechercher et aller n'importe où..."
                  className="flex-1 bg-transparent outline-none font-mono text-sm placeholder:text-muted-foreground"
                />
                <Kbd>esc</Kbd>
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto scrollbar-thin p-2">
                <Command.Empty className="p-4 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  aucun résultat
                </Command.Empty>
                {groups.map((g) => (
                  <Command.Group
                    key={g}
                    heading={g}
                    className="font-mono [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.22em] [&_[cmdk-group-heading]]:text-muted-foreground/70"
                  >
                    {items
                      .filter((i) => i.group === g)
                      .map((i) => (
                        <Command.Item
                          key={i.href}
                          value={`${i.group} ${i.label}`}
                          onSelect={() => handleSelect(i.href)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer font-mono text-sm data-[selected=true]:bg-white/[0.06] data-[selected=true]:border-white/[0.06] border border-transparent transition-colors"
                        >
                          <i.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="flex-1">{i.label}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {i.href}
                          </span>
                        </Command.Item>
                      ))}
                  </Command.Group>
                ))}
                <Command.Group
                  heading="Compte"
                  className="font-mono [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.22em] [&_[cmdk-group-heading]]:text-muted-foreground/70"
                >
                  <Command.Item
                    value="logout sign out"
                    onSelect={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer font-mono text-sm data-[selected=true]:bg-red-500/10 data-[selected=true]:text-red-300 border border-transparent transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Se déconnecter
                  </Command.Item>
                </Command.Group>
              </Command.List>
              <div className="border-t border-white/[0.06] px-3 py-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  naviguer
                </div>
                <div className="flex items-center gap-2">
                  <Kbd>↵</Kbd>
                  sélectionner
                </div>
              </div>
            </Command>
          </div>
        </div>
      )}
    </CommandMenuContext.Provider>
  );
}

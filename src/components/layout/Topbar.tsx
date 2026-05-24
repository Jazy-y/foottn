"use client";

import Link from "next/link";
import { Search, Menu, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import { LiveDot } from "@/components/ui/live-dot";
import { useCommandMenu } from "@/components/layout/CommandMenu";
import { NotificationsPopover } from "@/components/layout/NotificationsPopover";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, appUser } = useAuth();
  const { open } = useCommandMenu();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="h-full flex items-center justify-between px-4 md:px-6 gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <button
          onClick={open}
          className="flex-1 max-w-md inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left font-mono text-xs text-muted-foreground hover:bg-white/[0.04] transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 uppercase tracking-wider">rechercher et aller à…</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            <LiveDot variant="online" />
            {appUser?.role ?? "JOUEUR"}
          </div>

          <NotificationsPopover />

          <Popover>
            <PopoverTrigger
              render={
                <button className="block rounded-full hover:ring-2 hover:ring-primary/50 transition-all outline-none">
                  <Avatar className="h-8 w-8 hairline cursor-pointer">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback className="bg-card font-mono text-xs">
                      {user?.displayName?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <PopoverContent align="end" className="w-56 p-1 bg-card/95 backdrop-blur-xl border border-white/[0.06] shadow-2xl rounded-xl">
              <div className="px-3 py-2 text-sm font-medium border-b border-white/[0.06] mb-1 font-mono text-muted-foreground truncate">
                {user?.displayName || "Utilisateur"}
              </div>
              <div className="flex flex-col gap-0.5">
                <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                  <User className="h-4 w-4" />
                  Profil
                </Link>
                {appUser?.role === "SUPER_ADMIN" && (
                  <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors">
                    <Shield className="h-4 w-4" />
                    Administration !
                  </Link>
                )}
                <div className="h-px bg-white/[0.06] my-1" />
                <button
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}

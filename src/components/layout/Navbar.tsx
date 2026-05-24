"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveDot } from "@/components/ui/live-dot";
import { GradientText } from "@/components/ui/gradient-text";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Stades", href: "/stadiums" },
  { label: "Équipes", href: "/teams" },
  { label: "Événements", href: "/events" },
  { label: "Flux", href: "/feed" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, appUser, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all",
        scrolled
          ? "border-b border-white/[0.06] bg-background/70 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-0.1">
            <Image
              src="/logo2.png"
              alt="FootTN Logo"
              width={79}
              height={79}
              className="object-contain shrink-0"
              priority
            />
            <div className="flex flex-col leading-none gap-1 -ml-4">
              <span className="font-mono text-2xl font-black tracking-tight leading-none">
                <span className="text-foreground">OO</span>
                <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TT</span>
                <span className="text-foreground">N</span>
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.28em] uppercase text-emerald-400">
                Stade · Équipe · Passion
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-md">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.06] border border-white/[0.08]"
                      transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded-full bg-white/[0.04]" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <LiveDot variant="online" />
                    {appUser?.role || "JOUEUR"}
                  </span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-8 w-8 hairline">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-card font-mono text-xs">
                      {user.displayName?.charAt(0).toUpperCase() ||
                        user.email?.charAt(0).toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="hairline relative rounded-full bg-card px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-foreground transition-all hover:bg-card/70"
                >
                  Commencer →
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-foreground"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-b border-white/[0.06] bg-background/95 backdrop-blur-xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 font-mono text-sm uppercase tracking-wider text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
              {user ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-center"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                </Button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={buttonVariants({
                      variant: "outline",
                      className: "w-full justify-center",
                    })}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    className={buttonVariants({
                      className:
                        "w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90",
                    })}
                  >
                    Commencer →
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

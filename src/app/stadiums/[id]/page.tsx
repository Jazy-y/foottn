"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  CheckCircle2,
  ChevronLeft,
  Navigation,
  Info,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { LiveDot } from "@/components/ui/live-dot";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { getStadiumById } from "@/services/db";
import { Stadium } from "@/types";

const MOCK_STADIUMS: Record<string, Stadium> = {
  mock1: {
    id: "mock1",
    ownerId: "owner1",
    name: "Oasis Arena",
    description:
      "Un terrain intérieur 5v5 premium avec gazon synthétique de haute qualité. Équipé d'une climatisation de pointe, de douches de luxe et d'un salon d'attente pour les joueurs. Parfait pour les ligues compétitives ou les matchs amicaux.",
    location: "Centre-ville · Metro City",
    pricePerHour: 50,
    features: ["5v5", "Intérieur", "Douches", "Parking", "Salon", "Distributeur"],
    images: [
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1600&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
  mock2: {
    id: "mock2",
    ownerId: "owner2",
    name: "Neon Kickers",
    description:
      "Stade extérieur 7v7 avec éclairage néon pour les matchs nocturnes, tribune pour les spectateurs et tableau d'affichage en direct.",
    location: "Complexe sportif Est",
    pricePerHour: 80,
    features: ["7v7", "Extérieur", "Éclairage", "Café", "Score"],
    images: [
      "https://images.unsplash.com/photo-1518605368461-1ee1ea3e9c60?q=80&w=1600&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
  mock3: {
    id: "mock3",
    ownerId: "owner3",
    name: "The Grand Pitch",
    description:
      "Terrain complet 11v11 avec gazon standard UEFA, tournois professionnels et arbitres certifiés sur demande.",
    location: "Collines Nord",
    pricePerHour: 150,
    features: ["11v11", "Gazon", "Vestiaires", "Arbitres"],
    images: [
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1600&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
};

export default function StadiumDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStadiumById(id);
        setStadium(data ?? MOCK_STADIUMS[id] ?? MOCK_STADIUMS.mock1);
      } catch {
        setStadium(MOCK_STADIUMS[id] ?? MOCK_STADIUMS.mock1);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen text-foreground">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20 animate-pulse space-y-6">
          <div className="h-6 w-32 rounded-md bg-white/[0.04]" />
          <div className="h-[420px] rounded-xl bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (!stadium) return null;

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <Link
          href="/stadiums"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          retour à l'explorateur
        </Link>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="hairline relative h-[360px] md:h-[480px] rounded-2xl overflow-hidden mb-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stadium.images[0]}
            alt={stadium.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          <div className="absolute top-5 left-5 flex items-center gap-2">
            <div className="hairline rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground inline-flex items-center gap-1.5">
              <LiveDot variant="online" />
              disponible
            </div>
            <div className="rounded-full border border-white/[0.10] bg-black/40 backdrop-blur-md px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground inline-flex items-center gap-1.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              4.9 · 128 avis
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              / lieu · {stadium.id?.slice(0, 6)}
            </div>
            <h1 className="font-mono text-4xl md:text-6xl font-medium tracking-tight">
              <GradientText className="font-medium">
                {stadium.name}
              </GradientText>
            </h1>
            <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-sm text-foreground/80">
              <MapPin className="h-4 w-4 text-primary" />
              {stadium.location}
            </div>
          </div>
        </motion.div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
                <Info className="h-3.5 w-3.5 text-primary" />
                à propos de ce lieu
              </div>
              <p className="text-base text-foreground/85 leading-relaxed">
                {stadium.description}
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                équipements
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stadium.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                heures d'ouverture
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm">
                {[
                  { d: "Lun-Jeu", h: "10:00 — 23:00" },
                  { d: "Ven", h: "10:00 — 02:00" },
                  { d: "Sam", h: "08:00 — 02:00" },
                  { d: "Dim", h: "08:00 — 22:00" },
                ].map((s) => (
                  <div
                    key={s.d}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.d}
                    </div>
                    <div className="mt-1 tabular-nums">{s.h}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                emplacement
              </div>
              <div className="relative h-64 rounded-xl border border-white/[0.06] bg-dot-grid bg-card overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-mono text-sm">{stadium.location}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    carte interactive · bientôt disponible
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-1">
            <BookingWidget stadium={stadium} />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Star, Search, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { LiveDot } from "@/components/ui/live-dot";
import { Input } from "@/components/ui/input";
import { getAllStadiums } from "@/services/db";
import { Stadium } from "@/types";

const MOCK_STADIUMS: Stadium[] = [
  {
    id: "mock1",
    ownerId: "owner1",
    name: "Oasis Arena",
    description:
      "Un terrain intérieur 5v5 premium avec gazon synthétique de haute qualité, climatisation et douches de luxe.",
    location: "Centre-ville · Metro City",
    pricePerHour: 50,
    features: ["5v5", "Intérieur", "Douches", "Parking"],
    images: [
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
  {
    id: "mock2",
    ownerId: "owner2",
    name: "Neon Kickers",
    description:
      "Stade extérieur 7v7 avec néons pour les matchs nocturnes et tableau d'affichage en direct.",
    location: "Complexe sportif Est",
    pricePerHour: 80,
    features: ["7v7", "Extérieur", "Éclairage", "Café"],
    images: [
      "https://images.unsplash.com/photo-1518605368461-1ee1ea3e9c60?q=80&w=1200&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
  {
    id: "mock3",
    ownerId: "owner3",
    name: "The Grand Pitch",
    description:
      "Terrain complet 11v11 avec gazon standard UEFA, parfait pour les tournois.",
    location: "Collines Nord",
    pricePerHour: 150,
    features: ["11v11", "Gazon", "Vestiaires", "Arbitres"],
    images: [
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
  {
    id: "mock4",
    ownerId: "owner4",
    name: "SkyDeck Pitch",
    description:
      "Gazon hybride sur le toit avec vue sur la ville, expérience nocturne premium.",
    location: "Quartier de la Marina",
    pricePerHour: 120,
    features: ["5v5", "Toit", "Bar", "Salon"],
    images: [
      "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?q=80&w=1200&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
  {
    id: "mock5",
    ownerId: "owner5",
    name: "Iron Pitch",
    description:
      "Cage 7v7 à l'ambiance industrielle avec toit couvert, populaire pour les ligues de nuit.",
    location: "Vieux Port",
    pricePerHour: 95,
    features: ["7v7", "Couvert", "Éclairage", "Spectateurs"],
    images: [
      "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?q=80&w=1200&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
  {
    id: "mock6",
    ownerId: "owner6",
    name: "Atlas Arena",
    description:
      "Intérieur 5v5 climatisé avec salles de coaching pro et caméras d'analyse.",
    location: "Quartier chic",
    pricePerHour: 110,
    features: ["5v5", "Intérieur", "Caméras IA", "Douches"],
    images: [
      "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1200&auto=format&fit=crop",
    ],
    createdAt: null as never,
  },
];

export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  useEffect(() => {
    getAllStadiums()
      .then((data) => {
        setStadiums(data.length ? data : MOCK_STADIUMS);
      })
      .catch(() => setStadiums(MOCK_STADIUMS))
      .finally(() => setLoading(false));
  }, []);

  const SPORT_TYPES = ["5v5", "7v7", "11v11", "Tennis", "Basketball", "Futsal"];

  const cities = useMemo(() => {
    const set = new Set<string>();
    stadiums.forEach((s) => {
      const parts = s.location.split(/[·,]/); 
      parts.forEach((p) => { const t = p.trim(); if (t.length > 2) set.add(t); });
    });
    return Array.from(set).slice(0, 8);
  }, [stadiums]);

  const filtered = useMemo(() => {
    return stadiums.filter((s) => {
      const matchesQ =
        !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.location.toLowerCase().includes(query.toLowerCase());
      const matchesF = !filter || s.features.includes(filter);
      const matchesSport = !sportFilter || s.features.some((f) => f.toLowerCase().includes(sportFilter.toLowerCase()));
      const matchesCity = !cityFilter || s.location.toLowerCase().includes(cityFilter.toLowerCase());
      return matchesQ && matchesF && matchesSport && matchesCity;
    });
  }, [stadiums, query, filter, sportFilter, cityFilter]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    stadiums.forEach((s) => s.features.forEach((f) => set.add(f)));
    return Array.from(set).slice(0, 8);
  }, [stadiums]);

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="mb-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            / explorer
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h1 className="font-mono text-4xl md:text-5xl font-medium tracking-tight">
              Découvrir les{" "}
              <GradientText className="font-medium">stades</GradientText>
            </h1>
            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <LiveDot variant="online" />
              {stadiums.length} terrains indexés · dernière synchro{" "}
              <span className="text-foreground">à l'instant</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou emplacement..."
                className="pl-9 h-10 bg-white/[0.02] border-white/[0.06] font-mono"
              />
            </div>
            <select
              value={cityFilter ?? ""}
              onChange={(e) => setCityFilter(e.target.value || null)}
              className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 font-mono text-xs text-muted-foreground focus:outline-none focus:border-primary/40"
            >
              <option value="">Toutes les villes</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Sport type filter */}
          <div className="mt-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Type de sport</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setSportFilter(null)}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  !sportFilter ? "bg-primary text-primary-foreground" : "border border-white/[0.06] text-muted-foreground hover:text-foreground"
                }`}>Tous</button>
              {SPORT_TYPES.map((s) => (
                <button key={s} onClick={() => setSportFilter(s === sportFilter ? null : s)}
                  className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    sportFilter === s ? "bg-primary text-primary-foreground" : "border border-white/[0.06] text-muted-foreground hover:text-foreground"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Feature tags */}
          <div className="mt-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Équipements</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilter(null)}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  !filter ? "bg-primary text-primary-foreground" : "border border-white/[0.06] text-muted-foreground hover:text-foreground"
                }`}>tout</button>
              {tags.map((tag) => (
                <button key={tag} onClick={() => setFilter(tag === filter ? null : tag)}
                  className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    filter === tag ? "bg-primary text-primary-foreground" : "border border-white/[0.06] text-muted-foreground hover:text-foreground"
                  }`}>{tag}</button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GlassCard key={i} className="h-[420px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              Aucun stade ne correspond à votre recherche.
            </p>
          </GlassCard>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((stadium, i) => (
              <motion.div
                key={stadium.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Link href={`/stadiums/${stadium.id}`} className="block h-full">
                  <GlassCard hover className="overflow-hidden h-full p-0">
                    <div className="relative h-52 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stadium.images[0]}
                        alt={stadium.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-black/40 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        4.{8 + (i % 2)}
                      </div>
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                        <LiveDot variant="online" />
                        en direct
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
                          / lieu · {String(i + 1).padStart(3, "0")}
                        </div>
                        <h3 className="font-mono text-xl font-medium text-foreground">
                          {stadium.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 font-mono">
                        <MapPin className="h-3.5 w-3.5" />
                        {stadium.location}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-5">
                        {stadium.features.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            à partir de
                          </div>
                          <div className="font-mono text-2xl font-medium tabular-nums text-foreground">
                            {stadium.pricePerHour} TND
                            <span className="text-xs text-muted-foreground">
                              /h
                            </span>
                          </div>
                        </div>
                        <div className="hairline inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
                          réserver
                          <ArrowUpRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

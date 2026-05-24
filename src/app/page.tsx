"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, Users, Trophy, Zap, Shield, Activity, Sparkles, Star, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { LiveDot } from "@/components/ui/live-dot";
import { useAuth } from "@/contexts/AuthContext";

// ── Pitch lines SVG overlay ────────────────────────────────────────────
// Landscape viewBox 1200×630. Pitch interior: x=40,y=35 → x=1160,y=595
// Scale: 1120px wide (105m) = 10.67px/m | 560px tall (68m) = 8.24px/m
function PitchOverlay() {
  const s = "#22c55e";      // stroke colour
  const sw = 1.4;           // stroke width
  const op = 0.22;          // base opacity

  // Derived dimensions (px)
  const [x0, y0, x1, y1] = [40, 88, 1160, 575]; // pitch boundary
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; // center = 600, 315

  const pAreaD = 176;  // penalty area depth  (16.5m)
  const pAreaH = 332;  // penalty area height (40.32m – half: 166)
  const gAreaD = 59;   // goal area depth      (5.5m)
  const gAreaH = 151;  // goal area height    (18.32m – half: 75.5)
  const goalH   = 60;  // goal width           (7.32m – half: 30)
  const goalD   = 26;  // goal depth           (2.44m)
  const pSpot   = 117; // penalty spot from GL (11m)
  const cr      = 75;  // center circle radius (9.15m)
  const penArcR = 75;  // penalty arc radius   (same as center circle)
  const cornerR = 11;  // corner arc radius    (1m)

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 1200 630"
      preserveAspectRatio="xMidYMid slice"
      style={{ filter: "drop-shadow(0 0 5px rgba(34,197,94,0.5)) drop-shadow(0 0 20px rgba(34,197,94,0.2))" }}
    >
      {/* ── Pitch boundary ── */}
      <rect x={x0} y={y0} width={x1-x0} height={y1-y0} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>

      {/* ── Halfway line ── */}
      <line x1={cx} y1={y0} x2={cx} y2={y1} stroke={s} strokeWidth={sw} opacity={op}/>

      {/* ── Center circle + spot ── */}
      <circle cx={cx} cy={cy} r={cr}  fill="none" stroke={s} strokeWidth={sw} opacity={op+0.04}/>
      <circle cx={cx} cy={cy} r={3.5} fill={s} opacity={op+0.25}/>

      {/* ── LEFT end ── */}
      {/* Penalty area */}
      <rect x={x0} y={cy-pAreaH/2} width={pAreaD} height={pAreaH} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
      {/* Goal area */}
      <rect x={x0} y={cy-gAreaH/2} width={gAreaD} height={gAreaH} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
      {/* Goal */}
      <rect x={x0-goalD} y={cy-goalH/2} width={goalD} height={goalH} fill="none" stroke={s} strokeWidth={sw} opacity={op-0.04}/>
      {/* Penalty spot */}
      <circle cx={x0+pSpot} cy={cy} r={3} fill={s} opacity={op+0.2}/>
      {/* Penalty arc (only the portion outside penalty area) */}
      <clipPath id="leftArcClip">
        <rect x={x0+pAreaD} y={y0} width={x1-(x0+pAreaD)} height={y1-y0}/>
      </clipPath>
      <circle cx={x0+pSpot} cy={cy} r={penArcR} fill="none" stroke={s} strokeWidth={sw} opacity={op} clipPath="url(#leftArcClip)"/>

      {/* ── RIGHT end ── */}
      {/* Penalty area */}
      <rect x={x1-pAreaD} y={cy-pAreaH/2} width={pAreaD} height={pAreaH} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
      {/* Goal area */}
      <rect x={x1-gAreaD} y={cy-gAreaH/2} width={gAreaD} height={gAreaH} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
      {/* Goal */}
      <rect x={x1} y={cy-goalH/2} width={goalD} height={goalH} fill="none" stroke={s} strokeWidth={sw} opacity={op-0.04}/>
      {/* Penalty spot */}
      <circle cx={x1-pSpot} cy={cy} r={3} fill={s} opacity={op+0.2}/>
      {/* Penalty arc */}
      <clipPath id="rightArcClip">
        <rect x={x0} y={y0} width={(x1-pAreaD)-x0} height={y1-y0}/>
      </clipPath>
      <circle cx={x1-pSpot} cy={cy} r={penArcR} fill="none" stroke={s} strokeWidth={sw} opacity={op} clipPath="url(#rightArcClip)"/>

      {/* ── Corner arcs ── */}
      <path d={`M ${x0} ${y0+cornerR} A ${cornerR} ${cornerR} 0 0 1 ${x0+cornerR} ${y0}`} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
      <path d={`M ${x1-cornerR} ${y0} A ${cornerR} ${cornerR} 0 0 1 ${x1} ${y0+cornerR}`} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
      <path d={`M ${x0} ${y1-cornerR} A ${cornerR} ${cornerR} 0 0 0 ${x0+cornerR} ${y1}`} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
      <path d={`M ${x1-cornerR} ${y1} A ${cornerR} ${cornerR} 0 0 0 ${x1} ${y1-cornerR}`} fill="none" stroke={s} strokeWidth={sw} opacity={op}/>
    </svg>
  );
}

// ── Hex grid overlay (CTA section background) ─────────────────────────
function HexGridOverlay() {
  const s = "#22c55e";
  const r = 42;
  const dx = Math.sqrt(3) * r;   // ~72.7 — horizontal center-to-center
  const dy = 1.5 * r;            // 63   — vertical center-to-center

  const cols = Math.ceil(1200 / dx) + 2;
  const rows = Math.ceil(640 / dy) + 2;

  // A handful of cells that get a faint filled glow
  const lit = new Set(["2-2", "5-1", "9-3", "13-2", "16-4", "4-6", "8-5", "12-7", "15-6", "6-9", "11-8"]);

  const hexPath = (cx: number, cy: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${i === 0 ? "M" : "L"} ${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ") + " Z";

  const hexes: { key: string; d: string; glow: boolean }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * dx + (row % 2 === 1 ? dx / 2 : 0) - dx / 2;
      const cy = row * dy - dy / 2;
      const key = `${col}-${row}`;
      hexes.push({ key, d: hexPath(cx, cy), glow: lit.has(key) });
    }
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
    >
      {hexes.map(({ key, d, glow }) => (
        <path
          key={key}
          d={d}
          fill={glow ? "rgba(34,197,94,0.07)" : "none"}
          stroke={s}
          strokeWidth={glow ? 1.3 : 0.7}
          opacity={glow ? 0.32 : 0.09}
        />
      ))}
    </svg>
  );
}

// ── Glowing ball icon (SVG — no emoji) ────────────────────────────────
function Ball({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ filter: "drop-shadow(0 0 16px rgba(34,197,94,0.6)) drop-shadow(0 0 40px rgba(34,197,94,0.25))" }}>
        <circle cx="28" cy="28" r="26" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.25"/>
        <circle cx="28" cy="28" r="18" fill="rgba(34,197,94,0.08)" stroke="#22c55e" strokeWidth="1.5" opacity="0.6"/>
        <circle cx="28" cy="28" r="5" fill="#22c55e" opacity="0.9"/>
        <line x1="28" y1="10" x2="28" y2="46" stroke="#22c55e" strokeWidth="1" opacity="0.35"/>
        <line x1="10" y1="28" x2="46" y2="28" stroke="#22c55e" strokeWidth="1" opacity="0.35"/>
        <line x1="14" y1="14" x2="42" y2="42" stroke="#22c55e" strokeWidth="0.8" opacity="0.2"/>
        <line x1="42" y1="14" x2="14" y2="42" stroke="#22c55e" strokeWidth="0.8" opacity="0.2"/>
      </svg>
    </motion.div>
  );
}

const features = [
  { icon: Calendar, n: "01", title: "Réservation instantanée", desc: "Créneaux en direct, tarification dynamique, ticket QR généré à la confirmation.", color: "emerald" },
  { icon: Users, n: "02", title: "Équipes & Statistiques", desc: "Créez votre équipe, suivez victoires, buts, MVP et forme sur toute la saison.", color: "sky" },
  { icon: Trophy, n: "03", title: "Tournois & Événements", desc: "Organisez des matchs publics ou privés avec gestion automatique des équipes.", color: "amber" },
  { icon: Activity, n: "04", title: "Analytics Propriétaires", desc: "Revenus, occupation et prévisions pour maximiser vos terrains.", color: "violet" },
  { icon: Shield, n: "05", title: "Paiements Sécurisés", desc: "Stripe, portefeuille FootTN, factures PDF — zéro gestion manuelle.", color: "rose" },
  { icon: Sparkles, n: "06", title: "Tout est Intelligent", desc: "Recommandations IA, modération automatique et support 24/7.", color: "cyan" },
];

const colorMap: Record<string, string> = {
  emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-400",
  sky:     "from-sky-500/10 border-sky-500/20 text-sky-400",
  amber:   "from-amber-500/10 border-amber-500/20 text-amber-400",
  violet:  "from-violet-500/10 border-violet-500/20 text-violet-400",
  rose:    "from-rose-500/10 border-rose-500/20 text-rose-400",
  cyan:    "from-cyan-500/10 border-cyan-500/20 text-cyan-400",
};

const stats = [
  { v: "284", l: "Stades actifs", d: "+12 ce mois" },
  { v: "1.4k", l: "Réservations / jour", d: "+8.2%" },
  { v: "9 210", l: "Joueurs en ligne", d: "En direct" },
  { v: "87%", l: "Taux de remplissage", d: "+3.1%" },
];

const steps = [
  { n: "01", t: "Découvrir", d: "L'IA classe les terrains selon votre profil et votre historique de jeu.", icon: MapPin },
  { n: "02", t: "Réserver", d: "Choisissez un créneau, payez en 1 clic. Confirmation instantanée.", icon: Zap },
  { n: "03", t: "Jouer", d: "Ticket QR, chat d'équipe et stats synchronisées après le coup de sifflet final.", icon: Star },
];

const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 26 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

export default function Home() {
  const { user, appUser, loading } = useAuth();

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 overflow-hidden">

        {/* Radial green glow behind pitch */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[80px]" />
        </div>

        {/* Pitch SVG */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <PitchOverlay />
        </div>

        {/* Corner accent dots */}
        <div className="pointer-events-none absolute top-32 right-16 h-1.5 w-1.5 rounded-full bg-emerald-400/40" />
        <div className="pointer-events-none absolute bottom-24 left-20 h-1 w-1 rounded-full bg-primary/40" />

        <div className="relative mx-auto max-w-6xl w-full">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">

            {/* Live badge */}
            <motion.div variants={fade} className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300 mb-8">
              <LiveDot variant="online" />
              FootTN · Protocole v1.0 · En direct
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fade} className="font-mono text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-semibold leading-[1.0] tracking-tight text-balance">
              Le terrain.{" "}
              <GradientText className="font-semibold">L'équipe.</GradientText>
              <br />
              <span className="text-foreground/80">Le coup d'envoi.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p variants={fade} className="mt-7 max-w-xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
              FootTN regroupe réservation de stades, gestion d'équipes et tournois dans un seul tableau de bord premium.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fade} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              {loading ? (
                <div className="h-12 w-48 animate-pulse rounded-full bg-white/[0.04]" />
              ) : user ? (
                <Link href={appUser?.role === "SUPER_ADMIN" ? "/admin" : appUser?.role === "OWNER" ? "/owner" : "/dashboard"}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-mono text-sm uppercase tracking-wider text-black font-semibold hover:bg-emerald-400 transition-colors shadow-[0_0_32px_rgba(34,197,94,0.3)]">
                  Accéder à la console <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-mono text-sm uppercase tracking-wider text-black font-semibold hover:bg-emerald-400 transition-colors shadow-[0_0_32px_rgba(34,197,94,0.3)]">
                  Rejoindre FootTN <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
              <Link href="/stadiums"
                className="hairline inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 font-mono text-sm uppercase tracking-wider hover:bg-card/60 transition-colors">
                Explorer les stades
              </Link>
            </motion.div>

            {/* Glowing ball icon */}
            <motion.div variants={fade} className="mt-14 flex justify-center">
              <Ball />
            </motion.div>
          </motion.div>

          {/* Stats strip */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <GlassCard key={i} className="p-5 border-emerald-500/[0.07] bg-gradient-to-br from-emerald-500/[0.04] to-transparent">
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-2">{s.l}</div>
                <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">{s.v}</div>
                <div className="mt-1 font-mono text-[10px] text-emerald-400">{s.d}</div>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400 mb-3">/ modules</div>
            <h2 className="font-mono text-3xl md:text-5xl font-semibold tracking-tight">
              Six modules.{" "}<GradientText className="font-semibold">Une plateforme.</GradientText>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const colors = colorMap[f.color].split(" ");
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}>
                  <div className={`group h-full rounded-2xl border bg-gradient-to-br ${colors[0]} ${colors[1]} p-7 transition-all hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(0,0,0,0.3)] cursor-default`}>
                    <div className="flex items-center justify-between mb-7">
                      <div className="font-mono text-sm font-semibold text-muted-foreground/60">{f.n}</div>
                      <div className={`h-11 w-11 rounded-xl border ${colors[1]} bg-white/[0.05] flex items-center justify-center`}>
                        <f.icon className={`h-5 w-5 ${colors[2]}`} />
                      </div>
                    </div>
                    <h3 className="font-mono text-xl font-semibold mb-3">{f.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-28 overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400 mb-3">/ comment ça marche</div>
              <h2 className="font-mono text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
                Du vestiaire au{" "}<GradientText className="font-semibold">coup d'envoi</GradientText>{" "}en 60 secondes.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Chaque interaction est reliée dans une couche de contexte unique — données en direct, actualisation instantanée.
              </p>
              <div className="mt-10 space-y-4">
                {steps.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all">
                      <div className="font-mono text-2xl font-bold text-emerald-500/40 tabular-nums leading-none mt-0.5">{step.n}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <step.icon className="h-4 w-4 text-emerald-400" />
                          <h4 className="font-mono font-semibold">{step.t}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.d}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mock dashboard */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-emerald-500/[0.04] blur-2xl" />
              <GlassCard hairline className="relative p-5 border-emerald-500/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
                  <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-400/60"/><div className="h-2.5 w-2.5 rounded-full bg-amber-400/60"/><div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60"/></div>
                  <div className="flex-1 rounded-md bg-white/[0.03] border border-white/[0.04] px-3 py-1 font-mono text-[10px] text-muted-foreground">foottn://player/dashboard</div>
                </div>
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                {[["Prochain match","Auj. 20h00","text-emerald-300"],["Effectif","10 / 10","text-primary"],["Note","7.8 / 10","text-amber-300"]].map(([l,v,c],i)=>(
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground mb-1">{l}</div>
                      <div className={`font-mono text-sm font-semibold ${c}`}>{v}</div>
                    </div>
                  ))}
                </div>
                {/* Bar chart */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-3">Buts · 14 derniers matchs</div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[3,5,2,4,4,1,3,5,6,2,4,5,3,7].map((v,i)=>(
                      <motion.div key={i} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: i*0.04, duration: 0.4 }} style={{ height:`${(v/7)*100}%`, originY: 1 }}
                        className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500/70 to-emerald-500/20" />
                    ))}
                  </div>
                </div>
                {/* Live feed */}
                <div className="mt-3 space-y-1.5">
                {[
                    ["Ali M.","But · 73'","bg-emerald-400"],
                    ["Karim B.","Passe décisive","bg-sky-400"],
                    ["FootTN","Réservation confirmée","bg-primary"]
                  ].map(([n,t,dot],i)=>(
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${dot}`}/>
                      <div className="flex-1 min-w-0"><div className="font-mono text-xs font-medium truncate">{n}</div><div className="font-mono text-[10px] text-muted-foreground">{t}</div></div>
                      <LiveDot variant="online" />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      {!loading && !user && (
        <section className="relative px-4 sm:px-6 lg:px-8 py-32 overflow-hidden">
          <div className="pointer-events-none absolute inset-0"><HexGridOverlay /></div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-primary/[0.04]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="flex justify-center mb-8"><Ball /></div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400 mb-4">/ commencer</div>
              <h2 className="font-mono text-4xl md:text-6xl font-semibold tracking-tight">
                Prêt à entrer{" "}<GradientText className="font-semibold">sur le terrain ?</GradientText>
              </h2>
              <p className="mt-5 text-muted-foreground max-w-md mx-auto">
                Créez votre compte FootTN gratuitement. Les propriétaires obtiennent 3 mois d'analyses offerts.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 font-mono text-sm uppercase tracking-wider text-black font-semibold hover:bg-emerald-400 transition-colors shadow-[0_0_40px_rgba(34,197,94,0.35)]">
                  Créer un compte →
                </Link>
                <Link href="/stadiums" className="hairline inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 font-mono text-sm uppercase tracking-wider hover:bg-card/60 transition-colors">
                  Voir les stades
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-4 sm:px-6 lg:px-8 py-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo2.png" alt="FootTN" width={28} height={28} className="rounded-md object-contain opacity-80" />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">FootTN © {new Date().getFullYear()} · Tous droits réservés</span>
          </div>
          <div className="flex items-center gap-5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {[["Stades","/stadiums"],["Équipes","/teams"],["Événements","/events"],["Support","/support"]].map(([l,h])=>(
              <Link key={h} href={h} className="hover:text-foreground transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

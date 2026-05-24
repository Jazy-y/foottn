"use client";

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />

      <div className="absolute inset-0 bg-dot-grid opacity-60" />

      <div
        className="absolute top-[-20%] left-[-10%] h-[60vh] w-[60vh] rounded-full blur-[120px] opacity-[0.18] animate-drift-slow"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.78 0.18 175), transparent)",
        }}
      />
      <div
        className="absolute top-[20%] right-[-15%] h-[70vh] w-[70vh] rounded-full blur-[140px] opacity-[0.15] animate-drift-slower"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.72 0.22 295), transparent)",
        }}
      />
      <div
        className="absolute bottom-[-30%] left-[20%] h-[55vh] w-[55vh] rounded-full blur-[120px] opacity-[0.10] animate-drift-slow"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.85 0.15 80), transparent)",
          animationDelay: "-8s",
        }}
      />

      <div className="absolute inset-0 bg-grain opacity-[0.03] mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}

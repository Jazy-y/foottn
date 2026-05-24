"use client";

import { useState } from "react";
import { Bell, Shield, Globe, Trash2, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [bookingReminders, setBookingReminders] = useState(true);

  const timezone = typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "—";

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Déconnecté");
    router.push("/");
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          / paramètres
        </div>
        <h1 className="font-mono text-3xl font-medium">
          <GradientText className="font-medium">préférences</GradientText>
        </h1>
      </div>

      <div className="space-y-6">
        <GlassCard className="p-6">
          <SectionHeader
            icon={Bell}
            title="notifications"
            description="choisissez ce qui vous réveille."
          />
          <div className="mt-5 divide-y divide-white/[0.04]">
            <ToggleRow
              label="notifications par e-mail"
              description="rappels de matchs, factures, alertes système."
              value={emailNotifs}
              onChange={setEmailNotifs}
            />
            <ToggleRow
              label="notifications push"
              description="notifications en temps réel sur les appareils PWA."
              value={pushNotifs}
              onChange={setPushNotifs}
            />
            <ToggleRow
              label="rappels de réservation"
              description="2 heures avant le coup d'envoi."
              value={bookingReminders}
              onChange={setBookingReminders}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeader
            icon={Shield}
            title="sécurité"
            description="gérez l'authentification et les sessions."
          />
          <div className="mt-5 space-y-2">
            <RowLink label="e-mail" value={user?.email ?? "—"} disabled />
            <RowLink label="changer le mot de passe" hint="réinitialisation par e-mail" />
            <RowLink label="sessions actives" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeader
            icon={Globe}
            title="région & langue"
            description="paramètres régionaux."
          />
          <div className="mt-5 space-y-2">
            <RowLink label="langue" hint="français · fr" />
            <RowLink label="fuseau horaire" hint={timezone} />
            <RowLink label="devise" hint="TND · د.ت" />
          </div>
        </GlassCard>

        <GlassCard hairline className="p-6 border-red-500/20">
          <SectionHeader
            icon={Trash2}
            title="zone de danger"
            description="attention — ces actions sont irréversibles."
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-white/[0.08] hover:bg-white/[0.04] font-mono text-xs uppercase tracking-wider"
            >
              se déconnecter
            </Button>
            <button className="rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors px-4 py-2 font-mono text-xs uppercase tracking-wider text-red-300">
              supprimer le compte
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="hairline grid h-9 w-9 place-items-center rounded-lg bg-card shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="font-mono text-sm font-medium uppercase tracking-wider">
          {title}
        </div>
        {description && (
          <div className="font-mono text-[11px] text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 mr-4">
        <div className="font-mono text-sm uppercase tracking-wider">
          {label}
        </div>
        {description && (
          <div className="font-mono text-[11px] text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function RowLink({
  label,
  value,
  hint,
  disabled,
}: {
  label: string;
  value?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 font-mono text-xs ${
        disabled
          ? "opacity-60"
          : "hover:bg-white/[0.04] cursor-pointer transition-colors"
      }`}
    >
      <div>
        <span className="uppercase tracking-wider">{label}</span>
        {value && <span className="ml-2 text-muted-foreground">{value}</span>}
      </div>
      <div className="flex items-center gap-2">
        {hint && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {hint}
          </span>
        )}
        {!disabled && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    </div>
  );
}

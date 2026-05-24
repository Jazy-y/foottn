"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, Upload, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/services/db";
import { updateProfile } from "firebase/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import type { Position, SkillLevel } from "@/types";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, appUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = useMemo(
    () => ({
      displayName: appUser?.displayName ?? "",
      bio: appUser?.bio ?? "",
      position: (appUser?.position ?? "ANY") as Position,
      skillLevel: (appUser?.skillLevel ?? "INTERMEDIATE") as SkillLevel,
      photoURL: appUser?.photoURL ?? user?.photoURL ?? "",
    }),
    [appUser, user],
  );

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [position, setPosition] = useState<Position>(initial.position);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(initial.skillLevel);
  const [saving, setSaving] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string>(initial.photoURL);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleAvatarSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAvatarSelect(file);
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(initial.photoURL);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;
    setUploadingAvatar(true);
    try {
      return await uploadToCloudinary(avatarFile, "foottn/avatars");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let photoURL = initial.photoURL;

      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (uploaded) photoURL = uploaded;
      }

      await updateProfile(user, { displayName, photoURL: photoURL || null });
      await updateUserProfile(user.uid, {
        displayName,
        bio,
        position,
        skillLevel,
        photoURL,
      });
      toast.success("Profil mis à jour");
      router.push("/profile");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la mise à jour",
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        retour
      </Link>

      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          / profil · modifier
        </div>
        <h1 className="font-mono text-3xl font-medium">
          <GradientText className="font-medium">mettre à jour l'identité</GradientText>
        </h1>
      </div>

      <GlassCard hairline className="p-6">
        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Avatar Upload ── */}
          <div className="space-y-3">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              photo de profil
            </label>

            <div className="flex items-center gap-5">
              {/* Avatar preview */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-white/10 ring-offset-2 ring-offset-transparent">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/20 font-mono text-2xl font-bold text-primary">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Camera badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/80 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? "border-primary/70 bg-primary/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                  {avatarFile ? avatarFile.name : "glisser-déposer ou cliquer"}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground/60">
                  JPG, PNG, WEBP · max 5 Mo
                </span>
              </div>

              {/* Clear button */}
              {avatarFile && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* ── Display name ── */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              nom d'affichage
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-11 bg-white/[0.03] border-white/[0.08] font-mono"
              required
            />
          </div>

          {/* ── Bio ── */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              placeholder="parlez-nous de votre façon de jouer..."
            />
            <div className="font-mono text-[10px] text-muted-foreground text-right">
              {bio.length}/200
            </div>
          </div>

          {/* ── Position ── */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              position
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(["GK", "DEF", "MID", "FWD", "ANY"] as Position[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPosition(p)}
                  className={`h-10 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                    position === p
                      ? "bg-primary text-primary-foreground"
                      : "border border-white/[0.06] bg-white/[0.02] text-foreground/80 hover:bg-white/[0.04]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ── Skill level ── */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              niveau de compétence
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"] as SkillLevel[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkillLevel(s)}
                  className={`h-10 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
                    skillLevel === s
                      ? "bg-primary text-primary-foreground"
                      : "border border-white/[0.06] bg-white/[0.02] text-foreground/80 hover:bg-white/[0.04]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
            <Link
              href="/profile"
              className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              annuler
            </Link>
            <Button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
            >
              {saving || uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "enregistrer les modifications →"
              )}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

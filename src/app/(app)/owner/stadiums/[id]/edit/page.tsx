"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlassCard } from "@/components/ui/glass-card";
import { getStadiumById, updateStadium } from "@/services/db";

export default function EditOwnerStadiumPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");

  useEffect(() => {
    getStadiumById(id).then((s) => {
      if (!s) return;
      setName(s.name);
      setLocation(s.location);
      setPrice(String(s.pricePerHour));
      if (s.images && s.images.length > 0) {
        setCurrentImage(s.images[0]);
      }
    });
  }, [id]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let imageUrl = currentImage;

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        } else {
          console.error("Failed to upload image");
        }
      }

      await updateStadium(id, {
        name,
        location,
        pricePerHour: Number(price),
        ...(imageUrl ? { images: [imageUrl] } : {}),
      });

      router.push("/owner/stadiums");
    } catch (error) {
      console.error("Error updating stadium:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AuthGuard requiredRole={["OWNER", "SUPER_ADMIN"]}>
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <GlassCard className="p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">Nom du stade</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-background/50 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">Emplacement</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-background/50 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">Prix/Heure (TND)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-background/50 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">Photo du stade</label>
              {currentImage && (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentImage} alt="Current" className="h-32 w-full object-cover rounded-lg border border-white/[0.08]" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-lg border border-white/[0.08] bg-background/50 px-3 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-1 file:text-xs file:text-primary-foreground hover:file:bg-primary/90" />
            </div>
            <button disabled={isUploading} className="rounded-lg bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground disabled:opacity-50">
              {isUploading ? "..." : "sauvegarder"}
            </button>
          </form>
        </GlassCard>
      </div>
    </AuthGuard>
  );
}

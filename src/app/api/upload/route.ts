import { NextResponse } from "next/server";

/**
 * POST /api/upload
 * Server-side proxy to Cloudinary for cases where a server API route is needed.
 * Client components should call uploadToCloudinary() from src/lib/cloudinary.ts
 * directly — it's faster (no double hop) and needs no server.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        { error: "Cloudinary is not configured on the server." },
        { status: 500 },
      );
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    fd.append("folder", "foottn");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Cloudinary upload error:", err);
      return NextResponse.json(
        { error: "Cloudinary upload failed" },
        { status: 500 },
      );
    }

    const data = (await res.json()) as { secure_url: string };
    return NextResponse.json({ url: data.secure_url });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

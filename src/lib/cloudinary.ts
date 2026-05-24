/**
 * uploadToCloudinary — direct browser-to-Cloudinary unsigned upload.
 * No server round-trip, no API secret exposed.
 *
 * @param file   The File object to upload
 * @param folder Cloudinary folder (e.g. "avatars", "stadiums", "posts")
 * @returns      The permanent HTTPS URL of the uploaded image
 */
export async function uploadToCloudinary(
  file: File,
  folder = "foottn",
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Cloudinary upload failed: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`,
    );
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

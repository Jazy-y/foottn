import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadImage(
  file: File,
  path: string,
): Promise<string> {
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(r);
}

export async function deleteImage(path: string) {
  const r = ref(storage, path);
  await deleteObject(r).catch(() => {
    /* swallow */
  });
}

"use server";

import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { stampedFilename } from "@/lib/uploads";
import { NOTIF_UPLOAD_DIR } from "@/lib/notifUploads";
import { PushBroadcastError, sendPushBroadcast } from "@/lib/push";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function kirimNotifikasiBroadcast(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const url = String(formData.get("url") || "").trim();

  if (!title || !body) {
    return { success: false, error: "Judul dan isi pesan wajib diisi." };
  }

  let imageUrl: string | undefined;
  const file = formData.get("image");

  if (file instanceof File && file.size > 0) {
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return { success: false, error: "Format gambar harus JPG, PNG, atau WEBP." };
    }
    if (file.size > MAX_BYTES) {
      return { success: false, error: "Ukuran gambar maksimal 3MB." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(NOTIF_UPLOAD_DIR, { recursive: true });
    const filename = stampedFilename(file.name || `notif${ext}`, ext);
    await writeFile(path.join(NOTIF_UPLOAD_DIR, filename), buffer);
    imageUrl = `/api/notif-uploads/${filename}`;
  }

  try {
    const sent = await sendPushBroadcast({ title, body, url: url || undefined, image: imageUrl });
    return { success: true, sent };
  } catch (error: unknown) {
    console.error("[Notifikasi] Gagal mengirim broadcast:", error);
    return { success: false, error: error instanceof PushBroadcastError ? error.message : "Gagal mengirim notifikasi. Silakan coba lagi." };
  }
}

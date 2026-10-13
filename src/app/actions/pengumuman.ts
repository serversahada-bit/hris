"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { safeFilename, stampedFilename } from "@/lib/uploads";
import { ensurePengumumanTable } from "@/lib/pengumumanDb";
import { PENGUMUMAN_UPLOAD_DIR } from "@/lib/pengumumanUploads";
import { PushBroadcastError, sendPushBroadcast } from "@/lib/push";

const UPLOAD_DIR_FS = PENGUMUMAN_UPLOAD_DIR;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

const PUSH_BODY_MAX = 120;

function formatTanggalPush(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function savePengumuman(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  const tanggalPelaksanaan = String(formData.get("tanggal_pelaksanaan") ?? "").trim();

  if (!judul) return { error: "Judul wajib diisi." };
  if (!isi) return { error: "Isi pengumuman wajib diisi." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalPelaksanaan)) return { error: "Tanggal pelaksanaan wajib diisi." };

  let newFileName: string | null = null;
  const file = formData.get("lampiran");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return { error: "Ukuran lampiran terlalu besar. Maks 10MB." };
    }
    const originalName = file.name || "lampiran";
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return { error: "Lampiran harus PDF, JPG, PNG, atau WEBP." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base = safeFilename(path.basename(originalName, ext));
    newFileName = stampedFilename(base + ext, ext);

    try {
      await mkdir(UPLOAD_DIR_FS, { recursive: true });
      await writeFile(path.join(UPLOAD_DIR_FS, newFileName), buffer);
    } catch (error) {
      console.error("Failed to save lampiran pengumuman:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Gagal simpan lampiran: ${message}` };
    }
  }

  let isNew = false;

  try {
    await ensurePengumumanTable();

    if (id > 0) {
      let oldFile: string | null = null;
      if (newFileName) {
        const [rows] = await db.query("SELECT lampiran FROM pengumuman_hc WHERE id = ? LIMIT 1", [id]);
        const list = rows as { lampiran: string | null }[];
        oldFile = list[0]?.lampiran ?? null;
      }

      if (newFileName) {
        await db.query(
          "UPDATE pengumuman_hc SET judul=?, isi=?, lampiran=?, tanggal_pelaksanaan=?, updated_at=NOW() WHERE id=?",
          [judul, isi, newFileName, tanggalPelaksanaan, id]
        );
        if (oldFile) {
          try {
            await unlink(path.join(UPLOAD_DIR_FS, oldFile));
          } catch {
            // ignore if already missing
          }
        }
      } else {
        await db.query(
          "UPDATE pengumuman_hc SET judul=?, isi=?, tanggal_pelaksanaan=?, updated_at=NOW() WHERE id=?",
          [judul, isi, tanggalPelaksanaan, id]
        );
      }
    } else {
      await db.query(
        "INSERT INTO pengumuman_hc (judul, isi, lampiran, tanggal_pelaksanaan, created_by) VALUES (?, ?, ?, ?, ?)",
        [judul, isi, newFileName, tanggalPelaksanaan, adminId]
      );
      isNew = true;
    }

    revalidatePath("/pengumuman_hc");
  } catch (error) {
    console.error("Failed to save pengumuman:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan pengumuman: ${message}` };
  }

  // Push hanya untuk pengumuman baru. Pengumuman tetap tersimpan walau push gagal.
  if (isNew) {
    const ringkas = isi.length > PUSH_BODY_MAX ? `${isi.slice(0, PUSH_BODY_MAX).trimEnd()}…` : isi;
    try {
      await sendPushBroadcast({
        title: `📢 ${judul}`,
        body: `${formatTanggalPush(tanggalPelaksanaan)}\n${ringkas}`,
        url: "/dashboard",
      });
    } catch (error) {
      console.error("[Pengumuman] Gagal mengirim push:", error);
      const message = error instanceof PushBroadcastError ? error.message : "Gagal mengirim notifikasi.";
      return { success: true, pushWarning: `Pengumuman tersimpan, tapi notifikasi tidak terkirim. ${message}` };
    }
  }

  return { success: true };
}

export async function deletePengumuman(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  if (!id || id <= 0) {
    return { error: "ID tidak valid." };
  }

  try {
    const [rows] = await db.query("SELECT lampiran FROM pengumuman_hc WHERE id = ? LIMIT 1", [id]);
    const list = rows as { lampiran: string | null }[];
    const file = list[0]?.lampiran;

    if (file) {
      try {
        await unlink(path.join(UPLOAD_DIR_FS, file));
      } catch {
        // ignore if already missing
      }
    }

    await db.query("DELETE FROM pengumuman_hc WHERE id = ?", [id]);

    revalidatePath("/pengumuman_hc");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete pengumuman:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus pengumuman: ${message}` };
  }
}

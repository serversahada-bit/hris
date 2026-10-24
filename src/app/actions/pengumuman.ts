"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { ResultSetHeader } from "mysql2";
import { safeFilename, stampedFilename } from "@/lib/uploads";
import { ensurePengumumanTable, KARYAWAN_WAJIB_BACA_SQL, todayWib } from "@/lib/pengumumanDb";
import { PENGUMUMAN_UPLOAD_DIR } from "@/lib/pengumumanUploads";
import { PushBroadcastError } from "@/lib/push";
import { broadcastPengumuman, formatTanggalPush, kirimPushPengumumanPenting } from "@/lib/pengumumanPush";

const UPLOAD_DIR_FS = PENGUMUMAN_UPLOAD_DIR;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

type OldPengumumanRow = { judul: string; isi: string; lampiran: string | null; is_penting: number };

export async function savePengumuman(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  const tanggalPelaksanaan = String(formData.get("tanggal_pelaksanaan") ?? "").trim();
  const isPenting = formData.get("is_penting") === "1";
  const tglNotifikasi = isPenting ? String(formData.get("tgl_notifikasi") ?? "").trim() : null;

  if (!judul) return { error: "Judul wajib diisi." };
  if (!isi) return { error: "Isi pengumuman wajib diisi." };
  if (!DATE_RE.test(tanggalPelaksanaan)) return { error: "Tanggal pelaksanaan wajib diisi." };
  if (tglNotifikasi !== null) {
    if (!DATE_RE.test(tglNotifikasi)) return { error: "Tanggal notifikasi wajib diisi untuk pengumuman penting." };
    if (tglNotifikasi > tanggalPelaksanaan) return { error: "Tanggal notifikasi tidak boleh setelah tanggal pelaksanaan." };
  }

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

  let savedId = id;
  let isNew = false;

  try {
    await ensurePengumumanTable();

    if (id > 0) {
      const [rows] = await db.query("SELECT judul, isi, lampiran, is_penting FROM pengumuman_hc WHERE id = ? LIMIT 1", [id]);
      const old = (rows as OldPengumumanRow[])[0];
      if (!old) return { error: "Pengumuman tidak ditemukan." };

      // Isi berubah = semua karyawan wajib baca ulang (dan di-push ulang kalau tanggal notifikasinya sudah lewat).
      // Ubah tanggal saja tidak me-reset status baca.
      const kontenBerubah = old.judul !== judul || old.isi !== isi || newFileName !== null;
      const resetPush = isPenting && (kontenBerubah || !old.is_penting);

      await db.query(
        `UPDATE pengumuman_hc SET judul=?, isi=?, lampiran=?, tanggal_pelaksanaan=?, is_penting=?, tgl_notifikasi=?,
           push_terkirim_at=${resetPush ? "NULL" : "push_terkirim_at"}, updated_at=NOW()
         WHERE id=?`,
        [judul, isi, newFileName ?? old.lampiran, tanggalPelaksanaan, isPenting ? 1 : 0, tglNotifikasi, id]
      );
      if (kontenBerubah) {
        await db.query("DELETE FROM pengumuman_hc_baca WHERE pengumuman_id = ?", [id]);
      }
      if (newFileName && old.lampiran) {
        try {
          await unlink(path.join(UPLOAD_DIR_FS, old.lampiran));
        } catch {
          // ignore if already missing
        }
      }
    } else {
      const [result] = await db.query(
        `INSERT INTO pengumuman_hc (judul, isi, lampiran, tanggal_pelaksanaan, is_penting, tgl_notifikasi, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [judul, isi, newFileName, tanggalPelaksanaan, isPenting ? 1 : 0, tglNotifikasi, adminId]
      );
      savedId = (result as ResultSetHeader).insertId;
      isNew = true;
    }

    revalidatePath("/pengumuman_hc");
  } catch (error) {
    console.error("Failed to save pengumuman:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan pengumuman: ${message}` };
  }

  // Pengumuman penting di-push saat tgl_notifikasi tiba (cron); kalau sudah tiba, langsung di sini.
  if (tglNotifikasi !== null) {
    if (tglNotifikasi > todayWib()) {
      return { success: true, message: `Pengumuman tersimpan. Notifikasi & wajib baca dimulai ${formatTanggalPush(tglNotifikasi)}.` };
    }
    try {
      const [hasil] = await kirimPushPengumumanPenting(savedId);
      if (hasil?.error) {
        return { success: true, pushWarning: `Pengumuman tersimpan, tapi notifikasi tidak terkirim. ${hasil.error}` };
      }
      if (hasil) return { success: true, message: "Pengumuman penting tersimpan dan notifikasi terkirim ke karyawan." };
    } catch (error) {
      console.error("[Pengumuman] Gagal mengirim push penting:", error);
      return { success: true, pushWarning: "Pengumuman tersimpan, tapi notifikasi tidak terkirim." };
    }
    return { success: true };
  }

  // Pengumuman biasa: push hanya untuk pengumuman baru. Pengumuman tetap tersimpan walau push gagal.
  if (isNew) {
    try {
      await broadcastPengumuman(judul, isi, tanggalPelaksanaan);
    } catch (error) {
      console.error("[Pengumuman] Gagal mengirim push:", error);
      const message = error instanceof PushBroadcastError ? error.message : "Gagal mengirim notifikasi.";
      return { success: true, pushWarning: `Pengumuman tersimpan, tapi notifikasi tidak terkirim. ${message}` };
    }
    return { success: true, message: "Pengumuman tersimpan dan notifikasi terkirim ke karyawan." };
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
    await db.query("DELETE FROM pengumuman_hc_baca WHERE pengumuman_id = ?", [id]);

    revalidatePath("/pengumuman_hc");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete pengumuman:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus pengumuman: ${message}` };
  }
}

export type StatusBacaKaryawan = { nama: string; jabatan: string | null; dibacaAt: string | null };

export async function getStatusBacaPengumuman(id: number) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  try {
    await ensurePengumumanTable();
    const [rows] = await db.query(
      `SELECT k.nama, k.jabatan, DATE_FORMAT(b.dibaca_at, '%d/%m/%Y %H:%i') AS dibaca_at
       FROM pengumuman_hc p
       JOIN karyawan k ON ${KARYAWAN_WAJIB_BACA_SQL}
       LEFT JOIN pengumuman_hc_baca b ON b.pengumuman_id = p.id AND b.karyawan_id = k.id
       WHERE p.id = ? AND p.is_penting = 1
       ORDER BY k.nama ASC`,
      [id]
    );
    const list = (rows as { nama: string | null; jabatan: string | null; dibaca_at: string | null }[]).map((row) => ({
      nama: row.nama || "-",
      jabatan: row.jabatan,
      dibacaAt: row.dibaca_at,
    }));
    return {
      sudah: list.filter((row) => row.dibacaAt),
      belum: list.filter((row) => !row.dibacaAt),
    };
  } catch (error) {
    console.error("Failed to fetch status baca pengumuman:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal memuat status baca: ${message}` };
  }
}

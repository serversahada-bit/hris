"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { MAX_PDF_BYTES, isPdfBuffer, isPdfExtension, stampedFilename } from "@/lib/uploads";
import { PERATURAN_UPLOAD_DIR } from "@/lib/peraturanUploads";
import { KARYAWAN_WAJIB_BACA_PERATURAN_SQL, ensurePeraturanTables, formatTerbitLabel, jadwalTerbitWib } from "@/lib/peraturanDb";
import { nowWibDb } from "@/lib/pengumumanDb";

const UPLOAD_DIR_FS = PERATURAN_UPLOAD_DIR;

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function uploadPeraturan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  let judul = String(formData.get("judul") ?? "").trim();
  if (!judul) judul = "Aturan Perusahaan";

  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File PDF wajib diunggah." };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { error: "Ukuran file terlalu besar. Maks 20MB." };
  }

  const originalName = file.name || "dokumen.pdf";
  if (!isPdfExtension(originalName)) {
    return { error: "File harus PDF." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isPdfBuffer(buffer)) {
    return { error: "File terdeteksi bukan PDF yang valid." };
  }

  const newName = stampedFilename(originalName, ".pdf");

  try {
    await mkdir(UPLOAD_DIR_FS, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR_FS, newName), buffer);

    // Ikut batch terbit jam 15:00 WIB, sama seperti dokumen dari pengajuan karyawan.
    const terbitAt = jadwalTerbitWib();
    await db.query(
      "INSERT INTO peraturan_perusahaan (judul, file, uploaded_by, terbit_at) VALUES (?, ?, ?, ?)",
      [judul, newName, adminId, terbitAt]
    );

    revalidatePath("/peraturan_perusahaan");
    return { success: true, terbitLabel: formatTerbitLabel(terbitAt) };
  } catch (error) {
    console.error("Failed to upload peraturan perusahaan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal simpan file: ${message}` };
  }
}

export async function deletePeraturan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  if (!id || id <= 0) {
    return { error: "ID tidak valid." };
  }

  try {
    const [rows] = await db.query(
      "SELECT file FROM peraturan_perusahaan WHERE id = ? LIMIT 1",
      [id]
    );
    const list = rows as { file: string }[];
    const file = list[0]?.file ?? "";

    if (file) {
      try {
        await unlink(path.join(UPLOAD_DIR_FS, file));
      } catch {
        // file might already be missing on disk; ignore
      }
    }

    await db.query("DELETE FROM peraturan_perusahaan WHERE id = ?", [id]);
    await db.query("DELETE FROM peraturan_perusahaan_baca WHERE peraturan_id = ?", [id]);

    revalidatePath("/peraturan_perusahaan");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete peraturan perusahaan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus dokumen: ${message}` };
  }
}

export type StatusBacaPeraturanKaryawan = { nama: string; jabatan: string | null; divisi: string | null; dibacaAt: string | null };

// Daftar karyawan yang wajib membaca dokumen yang sudah terbit, dipisah sudah/belum klik "Saya sudah membaca" di Great.
export async function getStatusBacaPeraturan(id: number) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  try {
    await ensurePeraturanTables();
    const [rows] = await db.query(
      `SELECT k.nama, k.jabatan, k.organisasi, DATE_FORMAT(b.dibaca_at, '%d/%m/%Y %H:%i') AS dibaca_at
       FROM peraturan_perusahaan p
       JOIN karyawan k ON ${KARYAWAN_WAJIB_BACA_PERATURAN_SQL}
       LEFT JOIN peraturan_perusahaan_baca b ON b.peraturan_id = p.id AND b.karyawan_id = k.id
       WHERE p.id = ? AND p.terbit_at IS NOT NULL AND p.terbit_at <= ?
       ORDER BY k.nama ASC`,
      [id, nowWibDb()]
    );
    const list: StatusBacaPeraturanKaryawan[] = (
      rows as { nama: string | null; jabatan: string | null; organisasi: string | null; dibaca_at: string | null }[]
    ).map((row) => ({
      nama: row.nama || "-",
      jabatan: row.jabatan,
      divisi: row.organisasi,
      dibacaAt: row.dibaca_at,
    }));
    return {
      sudah: list.filter((row) => row.dibacaAt),
      belum: list.filter((row) => !row.dibacaAt),
    };
  } catch (error) {
    console.error("Failed to fetch status baca peraturan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal memuat status baca: ${message}` };
  }
}

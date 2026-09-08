"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { MAX_PDF_BYTES, isPdfBuffer, isPdfExtension, stampedFilename } from "@/lib/uploads";

const UPLOAD_DIR_FS = path.join(process.cwd(), "public", "uploads", "legal");

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function uploadLegal(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  let judul = String(formData.get("judul") ?? "").trim();
  if (!judul) judul = "Dokumen Legal";
  const kategori = String(formData.get("kategori") ?? "").trim() || "Lainnya";
  const tanggalBerlaku = String(formData.get("tanggal_berlaku") ?? "").trim();
  const tanggalKadaluarsa = String(formData.get("tanggal_kadaluarsa") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();

  const file = formData.get("file");
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

    await db.query(
      `INSERT INTO dokumen_legal (judul, kategori, file, tanggal_berlaku, tanggal_kadaluarsa, catatan, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [judul, kategori, newName, tanggalBerlaku || null, tanggalKadaluarsa || null, catatan || null, adminId]
    );

    revalidatePath("/legal");
    return { success: true };
  } catch (error) {
    console.error("Failed to upload dokumen legal:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal simpan file: ${message}` };
  }
}

export async function deleteLegal(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  if (!id || id <= 0) {
    return { error: "ID tidak valid." };
  }

  try {
    const [rows] = await db.query("SELECT file FROM dokumen_legal WHERE id = ? LIMIT 1", [id]);
    const list = rows as { file: string }[];
    const file = list[0]?.file ?? "";

    if (file) {
      try {
        await unlink(path.join(UPLOAD_DIR_FS, file));
      } catch {
        // file might already be missing on disk; ignore
      }
    }

    await db.query("DELETE FROM dokumen_legal WHERE id = ?", [id]);

    revalidatePath("/legal");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete dokumen legal:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus dokumen: ${message}` };
  }
}

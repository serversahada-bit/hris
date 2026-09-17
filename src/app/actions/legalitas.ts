"use server";

import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import db from "@/lib/db";
import { MAX_PDF_BYTES, isPdfBuffer, isPdfExtension, stampedFilename } from "@/lib/uploads";

const UPLOAD_DIR_FS = path.join(process.cwd(), "public", "uploads", "legalitas_hasil");

function normalizeStatus(status: FormDataEntryValue | null) {
  return typeof status === "string" ? status : "Pending";
}

export async function approveLegalitas(formData: FormData) {
  try {
    const id = Number(formData.get("legalitas_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));
    const estimasiHari = Number(formData.get("estimasi_hari"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }
    if (!estimasiHari || estimasiHari <= 0) {
      return { success: false, message: "Estimasi hari proses wajib diisi.", status: filterStatus };
    }

    const [rows] = await db.query("SELECT status FROM pengajuan_legalitas WHERE id = ? LIMIT 1", [id]);
    const record = (rows as Array<{ status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }
    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses.", status: filterStatus };
    }

    await db.query(
      "UPDATE pengajuan_legalitas SET status = 'Diproses', catatan_admin = NULL, estimasi_hari = ?, diproses_at = NOW() WHERE id = ? LIMIT 1",
      [estimasiHari, id]
    );

    revalidatePath("/legalitas");
    return { success: true, message: `Pengajuan mulai diproses (estimasi ${estimasiHari} hari).`, status: filterStatus };
  } catch (error) {
    console.error("Failed to approve legalitas:", error);
    return { success: false, message: "Gagal memproses pengajuan." };
  }
}

export async function selesaikanLegalitas(formData: FormData) {
  try {
    const id = Number(formData.get("legalitas_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    const file = formData.get("file_hasil");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Dokumen hasil wajib diunggah.", status: filterStatus };
    }
    if (file.size > MAX_PDF_BYTES) {
      return { success: false, message: "Ukuran file terlalu besar. Maks 20MB.", status: filterStatus };
    }
    const originalName = file.name || "hasil.pdf";
    if (!isPdfExtension(originalName)) {
      return { success: false, message: "File harus PDF.", status: filterStatus };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isPdfBuffer(buffer)) {
      return { success: false, message: "File terdeteksi bukan PDF yang valid.", status: filterStatus };
    }

    const [rows] = await db.query("SELECT status FROM pengajuan_legalitas WHERE id = ? LIMIT 1", [id]);
    const record = (rows as Array<{ status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }
    if (record.status !== "Diproses") {
      return { success: false, message: "Pengajuan ini belum dalam status Diproses.", status: filterStatus };
    }

    const newName = stampedFilename(originalName, ".pdf");
    await mkdir(UPLOAD_DIR_FS, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR_FS, newName), buffer);

    await db.query(
      "UPDATE pengajuan_legalitas SET status = 'Selesai', file_hasil = ?, selesai_at = NOW() WHERE id = ? LIMIT 1",
      [newName, id]
    );

    revalidatePath("/legalitas");
    return { success: true, message: "Dokumen hasil berhasil diunggah, pengajuan selesai.", status: filterStatus };
  } catch (error) {
    console.error("Failed to selesaikan legalitas:", error);
    return { success: false, message: "Gagal menyelesaikan pengajuan." };
  }
}

export async function rejectLegalitas(formData: FormData) {
  try {
    const id = Number(formData.get("legalitas_id"));
    const note = String(formData.get("catatan_admin") || "").trim();
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }
    if (!note) {
      return { success: false, message: "Alasan penolakan wajib diisi.", status: filterStatus };
    }

    const [rows] = await db.query("SELECT status FROM pengajuan_legalitas WHERE id = ? LIMIT 1", [id]);
    const record = (rows as Array<{ status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }
    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses.", status: filterStatus };
    }

    await db.query(
      "UPDATE pengajuan_legalitas SET status = 'Ditolak', catatan_admin = ?, manager_at = NOW() WHERE id = ? LIMIT 1",
      [note, id]
    );

    revalidatePath("/legalitas");
    return { success: true, message: "Pengajuan legalitas berhasil ditolak.", status: filterStatus };
  } catch (error) {
    console.error("Failed to reject legalitas:", error);
    return { success: false, message: "Gagal menolak pengajuan." };
  }
}

export async function deletePengajuanLegalitas(formData: FormData) {
  try {
    const id = Number(formData.get("legalitas_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    const [rows] = await db.query("SELECT file_hasil FROM pengajuan_legalitas WHERE id = ? LIMIT 1", [id]);
    const fileHasil = (rows as Array<{ file_hasil?: string | null }>)[0]?.file_hasil;
    if (fileHasil) {
      try {
        await unlink(path.join(UPLOAD_DIR_FS, fileHasil));
      } catch {
        // file mungkin sudah tidak ada di disk; abaikan
      }
    }

    await db.query("DELETE FROM pengajuan_legalitas WHERE id = ? LIMIT 1", [id]);

    revalidatePath("/legalitas");
    return { success: true, message: "Pengajuan berhasil dihapus.", status: filterStatus };
  } catch (error) {
    console.error("Failed to delete pengajuan legalitas:", error);
    return { success: false, message: "Gagal menghapus pengajuan." };
  }
}

"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import type { ResultSetHeader } from "mysql2";
import { PERATURAN_UPLOAD_DIR } from "@/lib/peraturanUploads";

type PengajuanRecord = {
  status?: string | null;
  judul?: string | null;
  file?: string | null;
};

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

async function findPengajuan(id: number) {
  const [rows] = await db.query(
    "SELECT status, judul, file FROM pengajuan_peraturan WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows as PengajuanRecord[])[0] ?? null;
}

async function removeFile(file: string | null | undefined) {
  if (!file) return;
  try {
    await unlink(path.join(PERATURAN_UPLOAD_DIR, path.basename(file)));
  } catch {
    // file might already be missing on disk; ignore
  }
}

export async function approvePengajuanPeraturan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { success: false, message: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("pengajuan_id"));
  if (!id) {
    return { success: false, message: "ID pengajuan tidak valid." };
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      "SELECT status, judul, file FROM pengajuan_peraturan WHERE id = ? LIMIT 1 FOR UPDATE",
      [id]
    );
    const record = (rows as PengajuanRecord[])[0];

    if (!record) {
      await conn.rollback();
      return { success: false, message: "Data pengajuan tidak ditemukan." };
    }

    if ((record.status ?? "Pending") !== "Pending") {
      await conn.rollback();
      return { success: false, message: "Pengajuan ini sudah diproses." };
    }

    const [insert] = await conn.query<ResultSetHeader>(
      "INSERT INTO peraturan_perusahaan (judul, file, uploaded_by) VALUES (?, ?, ?)",
      [record.judul || record.file, record.file, adminId]
    );

    await conn.query(
      `UPDATE pengajuan_peraturan
       SET status = 'Disetujui', catatan_admin = NULL, peraturan_id = ?, processed_at = NOW()
       WHERE id = ? LIMIT 1`,
      [insert.insertId, id]
    );

    await conn.commit();

    revalidatePath("/peraturan_perusahaan");
    return { success: true, message: "Pengajuan disetujui. Dokumen sudah masuk ke Peraturan Perusahaan." };
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("Failed to approve pengajuan peraturan:", error);
    return { success: false, message: "Gagal menyetujui pengajuan." };
  } finally {
    conn.release();
  }
}

export async function rejectPengajuanPeraturan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { success: false, message: "Sesi tidak valid. Silakan login ulang." };
  }

  try {
    const id = Number(formData.get("pengajuan_id"));
    const alasan = String(formData.get("alasan_admin") ?? "").trim();

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid." };
    }

    if (!alasan) {
      return { success: false, message: "Alasan penolakan wajib diisi." };
    }

    const record = await findPengajuan(id);
    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan." };
    }

    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses." };
    }

    const [result] = await db.query<ResultSetHeader>(
      `UPDATE pengajuan_peraturan
       SET status = 'Ditolak', catatan_admin = ?, processed_at = NOW()
       WHERE id = ? AND status = 'Pending' LIMIT 1`,
      [alasan.slice(0, 255), id]
    );

    if (result.affectedRows === 0) {
      return { success: false, message: "Pengajuan ini sudah diproses." };
    }

    // PDF yang ditolak tidak akan pernah tampil, jadi langsung dibuang dari storage.
    await removeFile(record.file);

    revalidatePath("/peraturan_perusahaan");
    return { success: true, message: "Pengajuan ditolak." };
  } catch (error) {
    console.error("Failed to reject pengajuan peraturan:", error);
    return { success: false, message: "Gagal menolak pengajuan." };
  }
}

export async function deletePengajuanPeraturan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { success: false, message: "Sesi tidak valid. Silakan login ulang." };
  }

  try {
    const id = Number(formData.get("pengajuan_id"));
    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid." };
    }

    const record = await findPengajuan(id);
    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan." };
    }

    // Pengajuan yang sudah disetujui menjadi sumber info "Diajukan oleh" di daftar
    // dokumen; untuk menghapus dokumennya, hapus dari tab Dokumen.
    if (record.status === "Disetujui") {
      return { success: false, message: "Pengajuan yang sudah disetujui tidak bisa dihapus dari sini." };
    }

    await db.query("DELETE FROM pengajuan_peraturan WHERE id = ? LIMIT 1", [id]);
    await removeFile(record.file);

    revalidatePath("/peraturan_perusahaan");
    return { success: true, message: "Pengajuan berhasil dihapus." };
  } catch (error) {
    console.error("Failed to delete pengajuan peraturan:", error);
    return { success: false, message: "Gagal menghapus pengajuan." };
  }
}

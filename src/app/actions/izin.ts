"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";

function normalizeStatus(status: FormDataEntryValue | null) {
  return typeof status === "string" ? status : "Pending";
}

export async function updatePengajuanIzin(formData: FormData) {
  try {
    const id = Number(formData.get("izin_id"));
    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid." };
    }

    const tipe = String(formData.get("tipe_izin") || "").trim();
    const mulai = String(formData.get("mulai_tanggal") || "").trim();
    const sampai = String(formData.get("sampai_tanggal") || "").trim();
    const alasan = String(formData.get("alasan") || "").trim();

    if (!tipe || !mulai || !sampai || !alasan) {
      return { success: false, message: "Semua field wajib diisi." };
    }

    if (sampai < mulai) {
      return { success: false, message: "Tanggal sampai tidak boleh lebih kecil dari mulai." };
    }

    await db.query(
      `UPDATE pengajuan_izin
       SET tipe_izin = ?, mulai_tanggal = ?, sampai_tanggal = ?, alasan = ?
       WHERE id = ?
       LIMIT 1`,
      [tipe, mulai, sampai, alasan, id]
    );

    revalidatePath("/izin");
    revalidatePath("/cuti_tahunan");
    return { success: true, message: "Data pengajuan berhasil diubah." };
  } catch (error) {
    console.error("Failed to update pengajuan izin:", error);
    return { success: false, message: "Gagal menyimpan perubahan pengajuan." };
  }
}

export async function finalApproveIzin(formData: FormData) {
  try {
    const id = Number(formData.get("izin_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    const [rows] = await db.query(
      "SELECT manager_status, status FROM pengajuan_izin WHERE id = ? LIMIT 1",
      [id]
    );
    const record = (rows as Array<{ manager_status?: string | null; status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }

    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses final.", status: filterStatus };
    }

    if ((record.manager_status ?? "Pending") !== "Disetujui") {
      return { success: false, message: "Belum bisa diproses HC. Menunggu ACC Manager.", status: filterStatus };
    }

    await db.query(
      "UPDATE pengajuan_izin SET status = 'Disetujui', catatan_admin = NULL WHERE id = ? LIMIT 1",
      [id]
    );

    revalidatePath("/izin");
    revalidatePath("/cuti_tahunan");
    return { success: true, message: "Status pengajuan berhasil diperbarui.", status: filterStatus };
  } catch (error) {
    console.error("Failed to approve izin:", error);
    return { success: false, message: "Gagal menyetujui pengajuan." };
  }
}

export async function finalRejectIzin(formData: FormData) {
  try {
    const id = Number(formData.get("izin_id"));
    const note = String(formData.get("alasan_admin") || "").trim();
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    if (!note) {
      return { success: false, message: "Alasan penolakan wajib diisi.", status: filterStatus };
    }

    const [rows] = await db.query(
      "SELECT manager_status, status FROM pengajuan_izin WHERE id = ? LIMIT 1",
      [id]
    );
    const record = (rows as Array<{ manager_status?: string | null; status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }

    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses final.", status: filterStatus };
    }

    if ((record.manager_status ?? "Pending") !== "Disetujui") {
      return { success: false, message: "Belum bisa diproses HC. Menunggu ACC Manager.", status: filterStatus };
    }

    await db.query(
      "UPDATE pengajuan_izin SET status = 'Ditolak', catatan_admin = ? WHERE id = ? LIMIT 1",
      [note, id]
    );

    revalidatePath("/izin");
    return { success: true, message: "Pengajuan berhasil ditolak.", status: filterStatus };
  } catch (error) {
    console.error("Failed to reject izin:", error);
    return { success: false, message: "Gagal menolak pengajuan." };
  }
}

export async function forceApproveManagerIzin(formData: FormData) {
  try {
    const id = Number(formData.get("izin_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    const [rows] = await db.query(
      "SELECT manager_status, status FROM pengajuan_izin WHERE id = ? LIMIT 1",
      [id]
    );
    const record = (rows as Array<{ manager_status?: string | null; status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }

    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses final.", status: filterStatus };
    }

    if ((record.manager_status ?? "Pending") === "Disetujui") {
      return { success: false, message: "Pengajuan ini sudah di-ACC Manager.", status: filterStatus };
    }

    if ((record.manager_status ?? "Pending") === "Ditolak") {
      return { success: false, message: "Pengajuan ini sudah ditolak Manager.", status: filterStatus };
    }

    await db.query(
      "UPDATE pengajuan_izin SET manager_status = 'Disetujui', manager_at = NOW() WHERE id = ? LIMIT 1",
      [id]
    );

    revalidatePath("/izin");
    return {
      success: true,
      message: "Pengajuan berhasil di-ACC sebagai Manager oleh HC.",
      status: filterStatus,
    };
  } catch (error) {
    console.error("Failed to force manager approval:", error);
    return { success: false, message: "Gagal mengubah status manager." };
  }
}

export async function deletePengajuanIzin(formData: FormData) {
  try {
    const id = Number(formData.get("izin_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    await db.query("DELETE FROM pengajuan_izin WHERE id = ? LIMIT 1", [id]);

    revalidatePath("/izin");
    revalidatePath("/cuti_tahunan");
    return { success: true, message: "Pengajuan berhasil dihapus.", status: filterStatus };
  } catch (error) {
    console.error("Failed to delete pengajuan izin:", error);
    return { success: false, message: "Gagal menghapus pengajuan." };
  }
}

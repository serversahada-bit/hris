"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";

function normalizeStatus(status: FormDataEntryValue | null) {
  return typeof status === "string" ? status : "Pending";
}

export async function approveRuangMeeting(formData: FormData) {
  try {
    const id = Number(formData.get("ruang_meeting_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    const [rows] = await db.query(
      "SELECT status FROM pengajuan_ruang_meeting WHERE id = ? LIMIT 1",
      [id]
    );
    const record = (rows as Array<{ status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }

    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses.", status: filterStatus };
    }

    await db.query(
      "UPDATE pengajuan_ruang_meeting SET status = 'Disetujui', catatan_admin = NULL WHERE id = ? LIMIT 1",
      [id]
    );

    revalidatePath("/ruang_meeting");
    return { success: true, message: "Pengajuan ruang meeting disetujui.", status: filterStatus };
  } catch (error) {
    console.error("Failed to approve pengajuan ruang meeting:", error);
    return { success: false, message: "Gagal menyetujui pengajuan." };
  }
}

export async function rejectRuangMeeting(formData: FormData) {
  try {
    const id = Number(formData.get("ruang_meeting_id"));
    const note = String(formData.get("alasan_admin") || "").trim();
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    if (!note) {
      return { success: false, message: "Alasan penolakan wajib diisi.", status: filterStatus };
    }

    const [rows] = await db.query(
      "SELECT status FROM pengajuan_ruang_meeting WHERE id = ? LIMIT 1",
      [id]
    );
    const record = (rows as Array<{ status?: string | null }>)[0];

    if (!record) {
      return { success: false, message: "Data pengajuan tidak ditemukan.", status: filterStatus };
    }

    if ((record.status ?? "Pending") !== "Pending") {
      return { success: false, message: "Pengajuan ini sudah diproses.", status: filterStatus };
    }

    await db.query(
      "UPDATE pengajuan_ruang_meeting SET status = 'Ditolak', catatan_admin = ? WHERE id = ? LIMIT 1",
      [note, id]
    );

    revalidatePath("/ruang_meeting");
    return { success: true, message: "Pengajuan ruang meeting ditolak.", status: filterStatus };
  } catch (error) {
    console.error("Failed to reject pengajuan ruang meeting:", error);
    return { success: false, message: "Gagal menolak pengajuan." };
  }
}

export async function deletePengajuanRuangMeeting(formData: FormData) {
  try {
    const id = Number(formData.get("ruang_meeting_id"));
    const filterStatus = normalizeStatus(formData.get("status_filter"));

    if (!id) {
      return { success: false, message: "ID pengajuan tidak valid.", status: filterStatus };
    }

    await db.query("DELETE FROM pengajuan_ruang_meeting WHERE id = ? LIMIT 1", [id]);

    revalidatePath("/ruang_meeting");
    return { success: true, message: "Pengajuan berhasil dihapus.", status: filterStatus };
  } catch (error) {
    console.error("Failed to delete pengajuan ruang meeting:", error);
    return { success: false, message: "Gagal menghapus pengajuan." };
  }
}

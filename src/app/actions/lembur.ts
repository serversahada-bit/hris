"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { cookies } from "next/headers";

export async function approveRejectLembur(formData: FormData) {
  try {
    const id = Number(formData.get("id"));
    const action = String(formData.get("hc_action") || "").toLowerCase();
    const notes = String(formData.get("hc_notes") || "").trim();

    const cookieStore = await cookies();
    const adminId = Number(cookieStore.get("admin_id")?.value) || 0;

    if (!id || !["approve", "reject"].includes(action)) {
      return { success: false, message: "Aksi atau ID tidak valid." };
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    if (newStatus === "REJECTED" && !notes) {
      return { success: false, message: "Catatan wajib diisi jika Reject." };
    }

    const [result]: any = await db.query(
      `UPDATE lembur
       SET status = ?,
           approved_by = ?,
           approved_at = NOW(),
           notes = ?
       WHERE id = ?
         AND status = 'PENDING'
       LIMIT 1`,
      [newStatus, adminId, notes || null, id]
    );

    if (result.affectedRows < 1) {
      return { success: false, message: "Gagal update. Mungkin sudah diproses HC sebelumnya." };
    }

    revalidatePath("/riwayat_lembur");
    return { success: true, message: `Berhasil diproses HC: ${newStatus}.` };
  } catch (error: any) {
    console.error("Failed to approve/reject lembur:", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

export async function editLembur(formData: FormData) {
  try {
    const id = Number(formData.get("id"));
    if (!id) return { success: false, message: "ID lembur tidak valid." };

    const mulai = String(formData.get("mulai_at") || "").trim();
    const selesai = String(formData.get("selesai_at") || "").trim();
    let durasi = Number(formData.get("durasi_menit")) || 0;
    const alasan = String(formData.get("alasan") || "").trim();
    let finalStatus = String(formData.get("status") || "").toUpperCase().trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!mulai || !selesai || !alasan) {
      return { success: false, message: "Mulai, selesai, dan alasan wajib diisi." };
    }

    const t1 = new Date(mulai).getTime();
    const t2 = new Date(selesai).getTime();

    if (isNaN(t1) || isNaN(t2)) {
      return { success: false, message: "Format tanggal tidak valid." };
    }
    if (t2 < t1) {
      return { success: false, message: "Selesai tidak boleh lebih kecil dari mulai." };
    }

    if (durasi <= 0) {
      durasi = Math.round((t2 - t1) / 60000);
    }

    const allowedFinal = ["PENDING", "APPROVED", "REJECTED", ""];
    if (!allowedFinal.includes(finalStatus)) finalStatus = "";

    if (finalStatus === "REJECTED" && !notes) {
      return { success: false, message: "Jika status final REJECTED, catatan HC wajib diisi." };
    }

    const mulaiDb = new Date(mulai).toISOString().slice(0, 19).replace("T", " ");
    const selesaiDb = new Date(selesai).toISOString().slice(0, 19).replace("T", " ");

    if (finalStatus !== "") {
      await db.query(
        `UPDATE lembur
         SET mulai_at = ?, selesai_at = ?, durasi_menit = ?, alasan = ?, status = ?, notes = ?
         WHERE id = ? LIMIT 1`,
        [mulaiDb, selesaiDb, durasi, alasan, finalStatus, notes || null, id]
      );
    } else {
      await db.query(
        `UPDATE lembur
         SET mulai_at = ?, selesai_at = ?, durasi_menit = ?, alasan = ?
         WHERE id = ? LIMIT 1`,
        [mulaiDb, selesaiDb, durasi, alasan, id]
      );
    }

    revalidatePath("/riwayat_lembur");
    return { success: true, message: "Berhasil mengubah data lembur." };
  } catch (error: any) {
    console.error("Failed to edit lembur:", error);
    return { success: false, message: "Gagal menyimpan perubahan." };
  }
}

export async function deleteLembur(formData: FormData) {
  try {
    const id = Number(formData.get("id"));
    if (!id) return { success: false, message: "ID lembur tidak valid." };

    const [result]: any = await db.query("DELETE FROM lembur WHERE id = ? LIMIT 1", [id]);

    if (result.affectedRows < 1) {
      return { success: false, message: "Gagal hapus. Data mungkin sudah diproses atau tidak ditemukan." };
    }

    revalidatePath("/riwayat_lembur");
    return { success: true, message: "Berhasil menghapus data lembur." };
  } catch (error: any) {
    console.error("Failed to delete lembur:", error);
    return { success: false, message: "Terjadi kesalahan server saat menghapus data." };
  }
}

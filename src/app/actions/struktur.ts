"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function setAtasanLangsung(anggotaId: number, managerId: number) {
  try {
    if (anggotaId <= 0) {
      return { success: false, message: "Karyawan tidak valid." };
    }

    if (managerId === anggotaId && managerId !== 0) {
      return { success: false, message: "Karyawan tidak boleh menjadi atasannya sendiri." };
    }

    // Delete existing manager mapping
    await db.query(`DELETE FROM tim_saya WHERE anggota_id = ?`, [anggotaId]);

    // Insert new manager mapping if managerId > 0
    if (managerId > 0) {
      await db.query(
        `INSERT INTO tim_saya (manager_id, anggota_id, created_at) VALUES (?, ?, NOW())`,
        [managerId, anggotaId]
      );
      revalidatePath("/hr_struktur");
      return { success: true, message: "Atasan berhasil diperbarui." };
    }

    revalidatePath("/hr_struktur");
    return { success: true, message: "Atasan dihapus. Karyawan sekarang tidak punya atasan." };
  } catch (error: any) {
    console.error("Error in setAtasanLangsung:", error);
    return { success: false, message: "Gagal menyimpan data tim. Error: " + error.message };
  }
}

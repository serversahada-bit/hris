"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";

export async function updateCutiPenyesuaian(formData: FormData) {
  try {
    const karyawanId = Number(formData.get("karyawan_id"));
    const tahun = Number(formData.get("tahun"));
    const penyesuaianRaw = String(formData.get("penyesuaian_hari") || "0").trim();
    const terpakaiOverrideRaw = String(formData.get("terpakai_override") || "").trim();
    const catatan = String(formData.get("catatan") || "").trim();

    if (!karyawanId) {
      return { success: false, message: "Karyawan tidak valid." };
    }

    if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
      return { success: false, message: "Tahun tidak valid." };
    }

    const penyesuaianHari = Number(penyesuaianRaw.replace(",", "."));
    if (!Number.isFinite(penyesuaianHari)) {
      return { success: false, message: "Penyesuaian hari harus berupa angka." };
    }

    let terpakaiOverride: number | null = null;
    if (terpakaiOverrideRaw) {
      terpakaiOverride = Number(terpakaiOverrideRaw.replace(",", "."));
      if (!Number.isFinite(terpakaiOverride) || terpakaiOverride < 0) {
        return { success: false, message: "Terpakai (override) harus berupa angka >= 0." };
      }
    }

    await db.query(
      `INSERT INTO cuti_penyesuaian (karyawan_id, tahun, penyesuaian_hari, terpakai_override, catatan)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE penyesuaian_hari = VALUES(penyesuaian_hari), terpakai_override = VALUES(terpakai_override), catatan = VALUES(catatan)`,
      [karyawanId, tahun, penyesuaianHari, terpakaiOverride, catatan || null]
    );

    revalidatePath("/cuti_tahunan");
    return { success: true, message: "Data cuti berhasil diperbarui." };
  } catch (error) {
    console.error("Failed to update cuti penyesuaian:", error);
    return { success: false, message: "Gagal menyimpan perubahan cuti." };
  }
}

"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function saveAsetPerawatan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const namaAset = String(formData.get("nama_aset") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "").trim();
  const lokasi = String(formData.get("lokasi") ?? "").trim();
  const tglTerakhir = String(formData.get("tanggal_servis_terakhir") ?? "").trim();
  const tglBerikutnya = String(formData.get("tanggal_servis_berikutnya") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();

  if (!namaAset) return { error: "Nama aset wajib diisi." };
  if (!kategori) return { error: "Kategori wajib dipilih." };
  if (!tglBerikutnya) return { error: "Tanggal servis berikutnya wajib diisi." };

  try {
    if (id > 0) {
      await db.query(
        `UPDATE aset_perawatan
         SET nama_aset=?, kategori=?, lokasi=?, tanggal_servis_terakhir=?, tanggal_servis_berikutnya=?, catatan=?, updated_at=NOW()
         WHERE id=?`,
        [namaAset, kategori, lokasi || null, tglTerakhir || null, tglBerikutnya, catatan || null, id]
      );
    } else {
      await db.query(
        `INSERT INTO aset_perawatan (nama_aset, kategori, lokasi, tanggal_servis_terakhir, tanggal_servis_berikutnya, catatan, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [namaAset, kategori, lokasi || null, tglTerakhir || null, tglBerikutnya, catatan || null, adminId]
      );
    }

    revalidatePath("/kalender_perawatan");
    return { success: true };
  } catch (error) {
    console.error("Failed to save aset perawatan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan data: ${message}` };
  }
}

export async function deleteAsetPerawatan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  if (!id || id <= 0) {
    return { error: "ID tidak valid." };
  }

  try {
    await db.query("DELETE FROM aset_perawatan WHERE id = ?", [id]);
    revalidatePath("/kalender_perawatan");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete aset perawatan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus data: ${message}` };
  }
}

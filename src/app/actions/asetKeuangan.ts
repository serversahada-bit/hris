"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function saveAsetKeuangan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const asetId = Number(formData.get("aset_id") ?? 0);
  const tanggal = String(formData.get("tanggal") ?? "").trim();
  const nominal = Number(formData.get("nominal") ?? 0);
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  if (!asetId) return { error: "Aset tidak valid." };
  if (!tanggal) return { error: "Tanggal wajib diisi." };
  if (!nominal || nominal <= 0) return { error: "Nominal wajib diisi dan lebih dari 0." };
  if (!keterangan) return { error: "Keterangan transaksi wajib diisi." };

  try {
    if (id > 0) {
      await db.query(
        `UPDATE aset_keuangan SET tanggal=?, nominal=?, keterangan=?, updated_at=NOW() WHERE id=? AND aset_id=?`,
        [tanggal, nominal, keterangan, id, asetId]
      );
    } else {
      await db.query(
        `INSERT INTO aset_keuangan (aset_id, tanggal, nominal, keterangan, created_by) VALUES (?, ?, ?, ?, ?)`,
        [asetId, tanggal, nominal, keterangan, adminId]
      );
    }

    revalidatePath(`/inventaris_hc/${asetId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save aset keuangan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan transaksi: ${message}` };
  }
}

export async function deleteAsetKeuangan(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  const asetId = Number(formData.get("aset_id"));
  if (!id || id <= 0 || !asetId) {
    return { error: "ID tidak valid." };
  }

  try {
    await db.query("DELETE FROM aset_keuangan WHERE id = ? AND aset_id = ?", [id, asetId]);
    revalidatePath(`/inventaris_hc/${asetId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete aset keuangan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus transaksi: ${message}` };
  }
}

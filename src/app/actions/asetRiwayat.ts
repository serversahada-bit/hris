"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

function clampPercent(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

export async function saveAsetRiwayat(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const asetId = Number(formData.get("aset_id") ?? 0);
  const sejakTanggal = String(formData.get("sejak_tanggal") ?? "").trim();
  const penanggungJawab = String(formData.get("penanggung_jawab") ?? "").trim();
  const lokasi = String(formData.get("lokasi") ?? "").trim();
  const jumlah = Number(formData.get("jumlah") ?? 1);
  const kondisiPersen = clampPercent(Number(formData.get("kondisi_persen") ?? 100));
  const kelengkapanPersen = clampPercent(Number(formData.get("kelengkapan_persen") ?? 100));
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  if (!asetId) return { error: "Aset tidak valid." };
  if (!sejakTanggal) return { error: "Sejak tanggal wajib diisi." };
  if (!penanggungJawab) return { error: "Penanggung jawab wajib diisi." };
  if (!lokasi) return { error: "Lokasi wajib diisi." };
  if (!jumlah || jumlah <= 0) return { error: "Jumlah wajib diisi dan lebih dari 0." };

  try {
    if (id > 0) {
      await db.query(
        `UPDATE aset_riwayat
         SET sejak_tanggal=?, penanggung_jawab=?, lokasi=?, jumlah=?, kondisi_persen=?, kelengkapan_persen=?, keterangan=?, updated_at=NOW()
         WHERE id=? AND aset_id=?`,
        [sejakTanggal, penanggungJawab, lokasi, jumlah, kondisiPersen, kelengkapanPersen, keterangan || null, id, asetId]
      );
    } else {
      await db.query(
        `INSERT INTO aset_riwayat (aset_id, sejak_tanggal, penanggung_jawab, lokasi, jumlah, kondisi_persen, kelengkapan_persen, keterangan, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [asetId, sejakTanggal, penanggungJawab, lokasi, jumlah, kondisiPersen, kelengkapanPersen, keterangan || null, adminId]
      );
    }

    revalidatePath(`/inventaris_hc/${asetId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save aset riwayat:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan riwayat: ${message}` };
  }
}

export async function deleteAsetRiwayat(formData: FormData) {
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
    await db.query("DELETE FROM aset_riwayat WHERE id = ? AND aset_id = ?", [id, asetId]);
    revalidatePath(`/inventaris_hc/${asetId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete aset riwayat:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus riwayat: ${message}` };
  }
}

"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ensureKantorTable } from "@/lib/kantorDb";
import { parseKoordinat } from "@/lib/kantorUtils";

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function saveKantor(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const nama = String(formData.get("nama") ?? "").trim();
  const alamat = String(formData.get("alamat") ?? "").trim();
  const titik = parseKoordinat(String(formData.get("koordinat") ?? ""));
  const radius = Number(formData.get("radius_meter") ?? 0);
  const isAktif = formData.get("is_aktif") === "1" ? 1 : 0;

  if (!nama) return { error: "Nama kantor wajib diisi." };
  if (nama.length > 100) return { error: "Nama kantor maksimal 100 karakter." };
  if (!titik) return { error: "Koordinat tidak valid. Contoh format: -7.629952, 111.540949" };
  if (!Number.isInteger(radius) || radius < 1 || radius > 5000) {
    return { error: "Radius harus berupa angka bulat 1–5000 meter." };
  }

  try {
    await ensureKantorTable();
    if (id > 0) {
      await db.query(
        `UPDATE kantor SET nama=?, alamat=?, latitude=?, longitude=?, radius_meter=?, is_aktif=?, updated_at=NOW() WHERE id=?`,
        [nama, alamat || null, titik.lat, titik.lon, radius, isAktif, id]
      );
    } else {
      await db.query(
        `INSERT INTO kantor (nama, alamat, latitude, longitude, radius_meter, is_aktif, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nama, alamat || null, titik.lat, titik.lon, radius, isAktif, adminId]
      );
    }
    revalidatePath("/lokasi_kantor");
    return { success: true };
  } catch (error) {
    console.error("Failed to save kantor:", error);
    return { error: "Gagal menyimpan data kantor." };
  }
}

export async function deleteKantor(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  if (!id) return { error: "ID kantor tidak valid." };

  try {
    // Riwayat absen menyimpan nama kantor sendiri, jadi aman dihapus.
    await db.query("DELETE FROM kantor WHERE id = ?", [id]);
    revalidatePath("/lokasi_kantor");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete kantor:", error);
    return { error: "Gagal menghapus kantor." };
  }
}

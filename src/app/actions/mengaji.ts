"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";

export async function upsertMengajiBaca(formData: FormData) {
  try {
    const bacaId = Number(formData.get("baca_id"));
    const karyawanId = Number(formData.get("karyawan_id"));
    const tanggal = String(formData.get("tanggal") || "").trim();
    const juz = Number(formData.get("juz")) || 0;
    let mulai = Number(formData.get("halaman_mulai")) || 0;
    let selesai = Number(formData.get("halaman_selesai")) || 0;
    const keterangan = String(formData.get("baca_keterangan") || "").trim();

    if (!karyawanId || !tanggal) {
      return { success: false, message: "Karyawan dan Tanggal wajib diisi." };
    }

    if (mulai < 1) mulai = 1;
    if (selesai < mulai) selesai = mulai;

    if (bacaId > 0) {
      await db.query(
        `UPDATE mengaji_baca SET juz = ?, halaman_mulai = ?, halaman_selesai = ?, keterangan = ? WHERE id = ? LIMIT 1`,
        [juz, mulai, selesai, keterangan, bacaId]
      );
    } else {
      await db.query(
        `INSERT INTO mengaji_baca (karyawan_id, tanggal, juz, halaman_mulai, halaman_selesai, keterangan, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [karyawanId, tanggal, juz, mulai, selesai, keterangan]
      );
    }

    revalidatePath("/mengaji_monitor");
    return { success: true, message: "Data mengaji berhasil disimpan." };
  } catch (error: any) {
    console.error("Failed to upsert mengaji_baca:", error);
    return { success: false, message: "Gagal menyimpan data mengaji." };
  }
}

export async function upsertMengajiIzin(formData: FormData) {
  try {
    const izinId = Number(formData.get("izin_id"));
    const karyawanId = Number(formData.get("karyawan_id"));
    const tanggal = String(formData.get("tanggal") || "").trim();
    const jenis = String(formData.get("izin_jenis") || "").trim();
    const keterangan = String(formData.get("izin_keterangan") || "").trim();

    if (!karyawanId || !tanggal) {
      return { success: false, message: "Karyawan dan Tanggal wajib diisi." };
    }
    
    if (!jenis) {
      return { success: false, message: "Jenis izin wajib diisi." };
    }

    if (izinId > 0) {
      await db.query(
        `UPDATE mengaji_izin SET jenis = ?, keterangan = ? WHERE id = ? LIMIT 1`,
        [jenis, keterangan, izinId]
      );
    } else {
      await db.query(
        `INSERT INTO mengaji_izin (karyawan_id, tanggal, jenis, keterangan, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [karyawanId, tanggal, jenis, keterangan]
      );
    }

    revalidatePath("/mengaji_monitor");
    return { success: true, message: "Data izin mengaji berhasil disimpan." };
  } catch (error: any) {
    console.error("Failed to upsert mengaji_izin:", error);
    return { success: false, message: "Gagal menyimpan data izin mengaji." };
  }
}

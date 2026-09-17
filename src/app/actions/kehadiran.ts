"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function editKehadiran(
  karyawanId: number, 
  tanggal: string, 
  jamMasuk: string, 
  jamPulang: string, 
  catatan: string
) {
  try {
    if (karyawanId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return { success: false, message: "Input tidak valid." };
    }

    const jm = (jamMasuk && /^\d{2}:\d{2}$/.test(jamMasuk)) ? `${jamMasuk}:00` : '';
    const jp = (jamPulang && /^\d{2}:\d{2}$/.test(jamPulang)) ? `${jamPulang}:00` : null;

    if (!jm) {
      return { success: false, message: "Jam masuk wajib diisi (format HH:mm)." };
    }

    const [cek]: any = await db.query(
      "SELECT id FROM presensi WHERE karyawan_id=? AND tanggal=? LIMIT 1",
      [karyawanId, tanggal]
    );

    if (cek.length === 0) {
      return { success: false, message: "Data presensi tanggal ini belum ada. Edit hanya bisa untuk data yang sudah tercatat." };
    }

    await db.query(
      "UPDATE presensi SET jam_masuk=?, jam_pulang=?, catatan=? WHERE karyawan_id=? AND tanggal=? LIMIT 1",
      [jm, jp, catatan, karyawanId, tanggal]
    );

    revalidatePath("/kehadiran");
    return { success: true, message: "Data kehadiran berhasil diperbarui." };
  } catch (error: any) {
    console.error("Error editing kehadiran:", error);
    return { success: false, message: "Gagal menyimpan data kehadiran." };
  }
}

export async function toggleJenisJadwal(karyawanId: number, action: 'add_streamer' | 'remove_streamer') {
  try {
    if (karyawanId <= 0) {
      return { success: false, message: "Karyawan tidak valid." };
    }

    if (action === 'add_streamer') {
      await db.query(
        "UPDATE karyawan SET jenis_jadwal='Shift Streamer' WHERE id=?", 
        [karyawanId]
      );
    } else {
      await db.query(
        "UPDATE karyawan SET jenis_jadwal='Tetap' WHERE id=?", 
        [karyawanId]
      );
    }

    revalidatePath("/kehadiran");
    return { success: true, message: "Jadwal berhasil diperbarui." };
  } catch (error) {
    console.error("Error toggleJenisJadwal:", error);
    return { success: false, message: "Gagal memperbarui jadwal." };
  }
}

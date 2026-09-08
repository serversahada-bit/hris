"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfilKaryawan(formData: FormData) {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("ID Karyawan tidak ditemukan");

    // Gather fields (similar to the old update_karyawan.php)
    const fields: Record<string, any> = {
      nama: formData.get("nama"),
      id_karyawan: formData.get("id_karyawan"),
      jenis_kelamin: formData.get("jenis_kelamin"),
      tempat_lahir: formData.get("tempat_lahir"),
      tanggal_lahir: formData.get("tanggal_lahir"),
      status_perkawinan: formData.get("status_perkawinan"),
      agama: formData.get("agama"),
      golongan_darah: formData.get("golongan_darah"),
      warga: formData.get("warga"),
      id_kartu_identitas: formData.get("id_kartu_identitas"),
      nomor_kk: formData.get("nomor_kk"),
      npwp: formData.get("npwp"),
      email: formData.get("email"),
      no_hp: formData.get("no_hp"),
      kontak_darurat: formData.get("kontak_darurat"),
      telp: formData.get("telp"),
      alamat_kartu_identitas: formData.get("alamat_kartu_identitas"),
      alamat_domisili: formData.get("alamat_domisili"),
      jabatan: formData.get("jabatan"),
      organisasi: formData.get("organisasi"), // Equivalent to 'tim' in PHP
      status_karyawan: formData.get("status_karyawan"),
      tanggal_bergabung: formData.get("tanggal_bergabung"),
      tanggal_masa_akhir_kerja: formData.get("tanggal_masa_akhir_kerja"),
      bank: formData.get("bank"),
      bpjs_kesehatan: formData.get("bpjs_kesehatan"),
      bpjs_ketenagakerjaan: formData.get("bpjs_ketenagakerjaan"),
    };

    const setClauses = [];
    const values = [];

    // Filter out null/undefined/empty fields
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && value !== "") {
        setClauses.push(`\`${key}\` = ?`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return { success: true, message: "Tidak ada data yang diubah." };
    }

    values.push(id); // For the WHERE clause

    const sql = `UPDATE karyawan SET ${setClauses.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    revalidatePath(`/detail/${id}`);
    revalidatePath(`/karyawan`);
    
    return { success: true, message: "Profil berhasil diperbarui." };

  } catch (error: any) {
    console.error("Error updating profil:", error);
    return { success: false, message: error.message || "Gagal memperbarui profil" };
  }
}

export async function tambahKaryawan(formData: FormData) {
  try {
    const fields: Record<string, any> = {
      nama: formData.get("nama"),
      id_karyawan: formData.get("id_karyawan"),
      jenis_kelamin: formData.get("jenis_kelamin"),
      tempat_lahir: formData.get("tempat_lahir"),
      tanggal_lahir: formData.get("tanggal_lahir"),
      status_perkawinan: formData.get("status_perkawinan"),
      agama: formData.get("agama"),
      golongan_darah: formData.get("golongan_darah"),
      warga: formData.get("warga"),
      id_kartu_identitas: formData.get("id_kartu_identitas"),
      nomor_kk: formData.get("nomor_kk"),
      npwp: formData.get("npwp"),
      email: formData.get("email"),
      no_hp: formData.get("no_hp"),
      kontak_darurat: formData.get("kontak_darurat"),
      telp: formData.get("telp"),
      alamat_kartu_identitas: formData.get("alamat_kartu_identitas"),
      alamat_domisili: formData.get("alamat_domisili"),
      jabatan: formData.get("jabatan"),
      organisasi: formData.get("organisasi"),
      status_karyawan: formData.get("status_karyawan"),
      tanggal_bergabung: formData.get("tanggal_bergabung"),
      tanggal_masa_akhir_kerja: formData.get("tanggal_masa_akhir_kerja"),
      bank: formData.get("bank"),
      bpjs_kesehatan: formData.get("bpjs_kesehatan"),
      bpjs_ketenagakerjaan: formData.get("bpjs_ketenagakerjaan"),
    };

    const columns = [];
    const values = [];
    const placeholders = [];

    // Filter out null/undefined/empty fields
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && value !== "") {
        columns.push(`\`${key}\``);
        values.push(value);
        placeholders.push('?');
      }
    }

    if (columns.length === 0) {
      return { success: false, message: "Data tidak boleh kosong." };
    }

    const sql = `INSERT INTO karyawan (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    const [result]: any = await db.query(sql, values);

    revalidatePath(`/karyawan`);
    revalidatePath(`/dashboard`);
    
    return { success: true, message: "Karyawan berhasil ditambahkan.", id: result.insertId };

  } catch (error: any) {
    console.error("Error menambahkan karyawan:", error);
    return { success: false, message: error.message || "Gagal menambahkan karyawan" };
  }
}

export async function nonaktifkanKaryawan(id: string | number) {
  try {
    await db.query("UPDATE karyawan SET status_karyawan = 'Non-Aktif' WHERE id = ?", [id]);
    revalidatePath(`/detail/${id}`);
    revalidatePath(`/karyawan`);
    return { success: true, message: "Karyawan berhasil dinonaktifkan." };
  } catch (error: any) {
    console.error("Error nonaktifkan karyawan:", error);
    return { success: false, message: "Gagal menonaktifkan karyawan." };
  }
}

export async function tambahRiwayatKarir(formData: FormData) {
  // To be fully implemented when career feature is fleshed out
  return { success: false, message: "Belum diimplementasikan" };
}

"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { KARYAWAN_IMPORT_FIELDS } from "@/lib/karyawanFields";

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
      pendidikan_terakhir: formData.get("pendidikan_terakhir"),
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

export async function updateAkunKaryawan(formData: FormData) {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("ID Karyawan tidak ditemukan");

    const namaUser = formData.get("nama_user")?.toString().trim() ?? "";
    const newPassword = formData.get("newPassword")?.toString() ?? "";
    const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

    if (!namaUser) {
      return { success: false, message: "Username tidak boleh kosong." };
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        return { success: false, message: "Password baru minimal 6 karakter." };
      }
      if (newPassword !== confirmPassword) {
        return { success: false, message: "Konfirmasi password baru tidak cocok." };
      }
    }

    const [existing] = await db.query(
      "SELECT id FROM karyawan WHERE nama_user = ? AND id <> ?",
      [namaUser, id]
    );
    if ((existing as { id: number }[]).length > 0) {
      return { success: false, message: "Username sudah dipakai karyawan lain." };
    }

    const setClauses = ["`nama_user` = ?"];
    const values: any[] = [namaUser];
    if (newPassword) {
      setClauses.push("`password` = ?");
      values.push(newPassword);
    }
    values.push(id);

    await db.query(`UPDATE karyawan SET ${setClauses.join(", ")} WHERE id = ?`, values);

    revalidatePath(`/detail/${id}`);

    return { success: true, message: "Akun berhasil diperbarui." };
  } catch (error: any) {
    console.error("Error updating akun karyawan:", error);
    return { success: false, message: error.message || "Gagal memperbarui akun." };
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
      pendidikan_terakhir: formData.get("pendidikan_terakhir"),
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

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function excelCellToString(value: any): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "object" && "text" in value) return String(value.text ?? "").trim();
  if (typeof value === "object" && "result" in value) return String(value.result ?? "").trim();
  return String(value).trim();
}

export async function importKaryawanExcel(formData: FormData) {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Pilih file Excel (.xlsx) untuk diimpor." };
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return { success: false, message: "Ukuran file maksimal 5MB." };
    }
    if (!/\.xlsx$/i.test(file.name || "")) {
      return { success: false, message: "Format file harus .xlsx (gunakan template yang disediakan)." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = new ExcelJS.Workbook();
    // exceljs' bundled types predate Node's generic Buffer<TArrayBuffer>; runtime accepts a plain Buffer fine.
    await wb.xlsx.load(buffer as any);
    const ws = wb.worksheets[0];
    if (!ws) {
      return { success: false, message: "Sheet data tidak ditemukan di file Excel." };
    }

    // Map kolom Excel -> field internal, berdasarkan judul header (fallback ke urutan kolom template)
    const headerRow = ws.getRow(1);
    const headerLabelToKey = new Map(KARYAWAN_IMPORT_FIELDS.map((f) => [normalizeHeader(f.label), f.key]));
    const columnKeyByIndex: (string | null)[] = [];
    let matchedByHeader = 0;

    for (let col = 1; col <= ws.columnCount; col++) {
      const headerText = normalizeHeader(excelCellToString(headerRow.getCell(col).value));
      const key = headerLabelToKey.get(headerText) || null;
      columnKeyByIndex[col] = key;
      if (key) matchedByHeader++;
    }

    // Kalau header tidak cocok sama sekali (mis. header dihapus), asumsikan urutan kolom sama seperti template
    if (matchedByHeader === 0) {
      KARYAWAN_IMPORT_FIELDS.forEach((f, idx) => {
        columnKeyByIndex[idx + 1] = f.key;
      });
    }

    const requiredKeys = KARYAWAN_IMPORT_FIELDS.filter((f) => f.required).map((f) => f.key);
    const errors: string[] = [];
    let inserted = 0;
    let skippedEmpty = 0;

    for (let rowNum = 2; rowNum <= ws.rowCount; rowNum++) {
      const row = ws.getRow(rowNum);
      const record: Record<string, any> = {};
      let hasAnyValue = false;

      for (let col = 1; col <= ws.columnCount; col++) {
        const key = columnKeyByIndex[col];
        if (!key) continue;
        const text = excelCellToString(row.getCell(col).value);
        if (text) hasAnyValue = true;
        record[key] = text || null;
      }

      if (!hasAnyValue) {
        skippedEmpty++;
        continue;
      }

      const missingRequired = requiredKeys.filter((k) => !record[k]);
      if (missingRequired.length > 0) {
        errors.push(`Baris ${rowNum}: ${missingRequired.join(", ")} wajib diisi.`);
        continue;
      }

      const columns = KARYAWAN_IMPORT_FIELDS.map((f) => f.key).filter((k) => record[k]);
      const values = columns.map((k) => record[k]);

      try {
        await db.query(
          `INSERT INTO karyawan (${columns.map((c) => `\`${c}\``).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
          values
        );
        inserted++;
      } catch (error: any) {
        errors.push(`Baris ${rowNum} (${record.nama || record.id_karyawan}): ${error.message || "gagal disimpan"}`);
      }
    }

    revalidatePath(`/karyawan`);
    revalidatePath(`/dashboard`);

    const summaryParts = [`${inserted} karyawan berhasil ditambahkan`];
    if (errors.length > 0) summaryParts.push(`${errors.length} baris gagal`);
    if (skippedEmpty > 0) summaryParts.push(`${skippedEmpty} baris kosong dilewati`);

    return {
      success: inserted > 0 || errors.length === 0,
      message: summaryParts.join(", ") + ".",
      inserted,
      errors,
    };
  } catch (error: any) {
    console.error("Error mengimpor karyawan:", error);
    return { success: false, message: error.message || "Gagal membaca file Excel.", inserted: 0, errors: [] as string[] };
  }
}

async function ensureRiwayatKarirTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS riwayat_karir (
      id INT AUTO_INCREMENT PRIMARY KEY,
      karyawan_id INT NOT NULL,
      tanggal_efektif DATE NOT NULL,
      jenis_perubahan VARCHAR(50),
      organisasi VARCHAR(150),
      jabatan VARCHAR(150),
      pangkat VARCHAR(100),
      status_karyawan VARCHAR(50),
      keterangan TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (karyawan_id)
    )`
  );
}

export async function tambahRiwayatKarir(formData: FormData) {
  try {
    const karyawanId = formData.get("karyawan_id")?.toString();
    if (!karyawanId) throw new Error("ID Karyawan tidak ditemukan");

    const tanggalEfektif = formData.get("tanggal_efektif")?.toString();
    const jenisPerubahan = formData.get("jenis_perubahan")?.toString();
    const organisasi = formData.get("organisasi")?.toString().trim() || null;
    const jabatan = formData.get("jabatan")?.toString().trim() || null;
    const pangkat = formData.get("pangkat")?.toString().trim() || null;
    const statusKaryawan = formData.get("status_karyawan")?.toString() || null;

    if (!tanggalEfektif || !jenisPerubahan) {
      return { success: false, message: "Tanggal efektif dan tipe perubahan wajib diisi." };
    }

    await ensureRiwayatKarirTable();

    await db.query(
      `INSERT INTO riwayat_karir (karyawan_id, tanggal_efektif, jenis_perubahan, organisasi, jabatan, pangkat, status_karyawan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [karyawanId, tanggalEfektif, jenisPerubahan, organisasi, jabatan, pangkat, statusKaryawan]
    );

    // Sync current employee record with the new career data
    const updates: Record<string, any> = {};
    if (organisasi) updates.organisasi = organisasi;
    if (jabatan) updates.jabatan = jabatan;
    if (statusKaryawan) updates.status_karyawan = statusKaryawan;

    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map((k) => `\`${k}\` = ?`);
      const values = Object.values(updates);
      values.push(karyawanId);
      await db.query(`UPDATE karyawan SET ${setClauses.join(", ")} WHERE id = ?`, values);
    }

    revalidatePath(`/detail/${karyawanId}`);
    revalidatePath(`/karyawan`);

    return { success: true, message: "Riwayat karir berhasil ditambahkan." };
  } catch (error: any) {
    console.error("Error menambahkan riwayat karir:", error);
    return { success: false, message: error.message || "Gagal menambahkan riwayat karir." };
  }
}

export async function berhentikanKaryawan(formData: FormData) {
  try {
    const karyawanId = formData.get("karyawan_id")?.toString();
    if (!karyawanId) throw new Error("ID Karyawan tidak ditemukan");

    const tanggalEfektif = formData.get("tanggal_efektif")?.toString();
    const keterangan = formData.get("keterangan")?.toString().trim() || null;

    if (!tanggalEfektif) {
      return { success: false, message: "Tanggal efektif berhenti wajib diisi." };
    }

    const [rows]: any = await db.query(
      "SELECT organisasi, jabatan FROM karyawan WHERE id = ? LIMIT 1",
      [karyawanId]
    );
    const current = rows?.[0] || {};

    await db.query(
      "UPDATE karyawan SET status_karyawan = 'Non-Aktif', tanggal_masa_akhir_kerja = ? WHERE id = ?",
      [tanggalEfektif, karyawanId]
    );

    await ensureRiwayatKarirTable();
    await db.query(
      `INSERT INTO riwayat_karir (karyawan_id, tanggal_efektif, jenis_perubahan, organisasi, jabatan, status_karyawan, keterangan)
       VALUES (?, ?, 'Berhenti', ?, ?, 'Non-Aktif', ?)`,
      [karyawanId, tanggalEfektif, current.organisasi || null, current.jabatan || null, keterangan]
    );

    revalidatePath(`/detail/${karyawanId}`);
    revalidatePath(`/karyawan`);

    return { success: true, message: "Karyawan berhasil diberhentikan." };
  } catch (error: any) {
    console.error("Error memberhentikan karyawan:", error);
    return { success: false, message: error.message || "Gagal memberhentikan karyawan." };
  }
}

import db from "./db";
import "server-only";
import { nowWibDb } from "./pengumumanDb";

// Dokumen yang disetujui/diupload sebelum jam ini (WIB) terbit hari itu, sisanya besok di jam yang sama.
const JAM_TERBIT = "15:00:00";

// Cek lewat information_schema (bukan ADD COLUMN IF NOT EXISTS) supaya jalan di MariaDB lokal & MySQL 8 production.
async function addColumnIfMissing(column: string, alterSql: string) {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'peraturan_perusahaan' AND COLUMN_NAME = ?`,
      [column]
    );
    if (Number((rows as { c: number }[])[0]?.c ?? 0) === 0) {
      await db.query(alterSql);
    }
  } catch (error) {
    console.warn(`Skip migrasi kolom ${column}:`, error);
  }
}

export async function ensurePeraturanTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS peraturan_perusahaan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      judul VARCHAR(255) NOT NULL,
      file VARCHAR(255) NOT NULL,
      uploaded_by INT NULL,
      uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (uploaded_at),
      INDEX (uploaded_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // terbit_at (WIB): dokumen baru tampil & wajib dibaca di Great mulai jam ini. NULL = dokumen lama
  // sebelum fitur terbit dibuat — langsung tampil, tanpa popup wajib baca.
  await addColumnIfMissing(
    "terbit_at",
    "ALTER TABLE peraturan_perusahaan ADD COLUMN terbit_at DATETIME NULL AFTER uploaded_at, ADD INDEX (terbit_at)"
  );
  await addColumnIfMissing("push_terkirim_at", "ALTER TABLE peraturan_perusahaan ADD COLUMN push_terkirim_at DATETIME NULL AFTER terbit_at");

  await db.query(`
    CREATE TABLE IF NOT EXISTS pengajuan_peraturan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      karyawan_id INT NOT NULL,
      judul VARCHAR(255) NOT NULL,
      file VARCHAR(255) NOT NULL,
      catatan TEXT NULL,
      status ENUM('Pending', 'Disetujui', 'Ditolak') NOT NULL DEFAULT 'Pending',
      catatan_admin VARCHAR(255) NULL,
      peraturan_id INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME NULL,
      INDEX idx_karyawan (karyawan_id),
      INDEX idx_status (status),
      INDEX idx_peraturan (peraturan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Dibaca dari & ditulis oleh absen-main (popup "Saya sudah membaca"). dibaca_at diisi jam WIB oleh absen-main.
  await db.query(`
    CREATE TABLE IF NOT EXISTS peraturan_perusahaan_baca (
      id INT AUTO_INCREMENT PRIMARY KEY,
      peraturan_id INT NOT NULL,
      karyawan_id INT NOT NULL,
      dibaca_at DATETIME NOT NULL,
      UNIQUE KEY uniq_peraturan_karyawan (peraturan_id, karyawan_id),
      INDEX (karyawan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// Karyawan aktif yang wajib membaca dokumen `p`: yang bergabung paling lambat di tanggal terbitnya.
// Kondisi yang sama dipakai absen-main (src/lib/peraturanWajib.ts) — ubah keduanya bersamaan.
export const KARYAWAN_WAJIB_BACA_PERATURAN_SQL = `
  (k.status_karyawan IS NULL OR k.status_karyawan <> 'Non-Aktif')
  AND (
    k.tanggal_bergabung IS NULL
    OR k.tanggal_bergabung NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    OR k.tanggal_bergabung <= DATE_FORMAT(p.terbit_at, '%Y-%m-%d')
  )
`;

/** Jadwal terbit (WIB, yyyy-mm-dd HH:mm:ss) untuk dokumen yang disetujui/diupload sekarang. */
export function jadwalTerbitWib() {
  const [tanggal, jam] = nowWibDb().split(" ");
  if (jam < JAM_TERBIT) return `${tanggal} ${JAM_TERBIT}`;

  const [y, m, d] = tanggal.split("-").map(Number);
  const besok = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return `${besok} ${JAM_TERBIT}`;
}

/** "Senin, 2 November 2026 15:00" dari string DATETIME WIB. */
export function formatTerbitLabel(value: string) {
  const [tanggal, jam] = value.split(" ");
  const [y, m, d] = tanggal.split("-").map(Number);
  const hari = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
  return `${hari} ${jam.slice(0, 5)}`;
}

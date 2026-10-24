import db from "./db";
import "server-only";

// Cek lewat information_schema (bukan ADD COLUMN IF NOT EXISTS) supaya jalan di MariaDB lokal & MySQL 8 production.
async function addColumnIfMissing(column: string, alterSql: string) {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman_hc' AND COLUMN_NAME = ?`,
      [column]
    );
    if (Number((rows as { c: number }[])[0]?.c ?? 0) === 0) {
      await db.query(alterSql);
    }
  } catch (error) {
    console.warn(`Skip migrasi kolom ${column}:`, error);
  }
}

export async function ensurePengumumanTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pengumuman_hc (
      id INT AUTO_INCREMENT PRIMARY KEY,
      judul VARCHAR(255) NOT NULL,
      isi TEXT NOT NULL,
      lampiran VARCHAR(255) NULL,
      tanggal_pelaksanaan DATE NULL,
      created_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      INDEX (created_at),
      INDEX (tanggal_pelaksanaan)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing(
    "tanggal_pelaksanaan",
    "ALTER TABLE pengumuman_hc ADD COLUMN tanggal_pelaksanaan DATE NULL AFTER lampiran, ADD INDEX (tanggal_pelaksanaan)"
  );

  // Pengumuman Penting: wajib dibaca di Great mulai tgl_notifikasi (sekaligus jadwal push-nya).
  await addColumnIfMissing("is_penting", "ALTER TABLE pengumuman_hc ADD COLUMN is_penting TINYINT(1) NOT NULL DEFAULT 0 AFTER tanggal_pelaksanaan");
  await addColumnIfMissing(
    "tgl_notifikasi",
    "ALTER TABLE pengumuman_hc ADD COLUMN tgl_notifikasi DATE NULL AFTER is_penting, ADD INDEX (tgl_notifikasi)"
  );
  await addColumnIfMissing("push_terkirim_at", "ALTER TABLE pengumuman_hc ADD COLUMN push_terkirim_at DATETIME NULL AFTER tgl_notifikasi");

  // Dibaca dari & ditulis oleh absen-main (popup "Saya sudah membaca"). dibaca_at diisi jam WIB oleh absen-main.
  await db.query(`
    CREATE TABLE IF NOT EXISTS pengumuman_hc_baca (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pengumuman_id INT NOT NULL,
      karyawan_id INT NOT NULL,
      dibaca_at DATETIME NOT NULL,
      UNIQUE KEY uniq_pengumuman_karyawan (pengumuman_id, karyawan_id),
      INDEX (karyawan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// Karyawan aktif yang wajib membaca pengumuman `p`: yang bergabung paling lambat di tgl_notifikasi.
// tanggal_bergabung berupa VARCHAR (yyyy-mm-dd dari form karyawan); kosong/format lain = tetap wajib baca.
// Kondisi yang sama dipakai absen-main (src/lib/pengumumanWajib.ts) — ubah keduanya bersamaan.
export const KARYAWAN_WAJIB_BACA_SQL = `
  (k.status_karyawan IS NULL OR k.status_karyawan <> 'Non-Aktif')
  AND (
    k.tanggal_bergabung IS NULL
    OR k.tanggal_bergabung NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    OR k.tanggal_bergabung <= DATE_FORMAT(p.tgl_notifikasi, '%Y-%m-%d')
  )
`;

/** Tanggal hari ini di WIB (yyyy-mm-dd), tidak bergantung timezone container (Coolify = UTC). */
export function todayWib() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Jam sekarang di WIB untuk kolom DATETIME (yyyy-mm-dd HH:mm:ss) — bukan NOW() yang ikut timezone server DB. */
export function nowWibDb() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

import db from "./db";
import "server-only";

// Kolom hasil cek jarak di presensi, diisi absen-main (src/lib/kantor.ts) saat karyawan absen:
// nama kantor terdekat (snapshot, tetap terbaca walau kantornya dihapus), jarak dalam meter, dan 1 = di luar radius.
const PRESENSI_COLUMNS: [string, string][] = [
  ["kantor_masuk", "VARCHAR(100) NULL"],
  ["jarak_masuk", "INT NULL"],
  ["luar_kantor_masuk", "TINYINT(1) NULL"],
  ["kantor_pulang", "VARCHAR(100) NULL"],
  ["jarak_pulang", "INT NULL"],
  ["luar_kantor_pulang", "TINYINT(1) NULL"],
];

let ensured: Promise<void> | null = null;

/** Sekali per proses: halaman Kehadiran memanggil ini di setiap request. */
export function ensureKantorTable() {
  ensured ??= migrate().catch((error) => {
    ensured = null;
    throw error;
  });
  return ensured;
}

/** Kolom jarak untuk SELECT presensi; NULL semua kalau migrasi gagal, supaya halaman Kehadiran tetap tampil. */
export async function selectJarakKantor(alias: string) {
  try {
    await ensureKantorTable();
    return PRESENSI_COLUMNS.map(([name]) => `${alias}.${name}`).join(", ");
  } catch (error) {
    console.warn("Skip kolom jarak kantor:", error);
    return PRESENSI_COLUMNS.map(([name]) => `NULL AS ${name}`).join(", ");
  }
}

async function migrate() {
  // Dibaca absen-main untuk mencari kantor aktif terdekat dari lokasi GPS karyawan.
  await db.query(`
    CREATE TABLE IF NOT EXISTS kantor (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(100) NOT NULL,
      alamat TEXT NULL,
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      radius_meter INT NOT NULL DEFAULT 10,
      is_aktif TINYINT(1) NOT NULL DEFAULT 1,
      created_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Cek lewat information_schema (bukan ADD COLUMN IF NOT EXISTS) supaya jalan di MariaDB lokal & MySQL 8 production.
  const [rows] = await db.query(
    `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presensi'`
  );
  const existing = new Set((rows as { name: string }[]).map((row) => row.name));
  const missing = PRESENSI_COLUMNS.filter(([name]) => !existing.has(name));
  if (missing.length > 0) {
    await db.query(`ALTER TABLE presensi ${missing.map(([name, type]) => `ADD COLUMN ${name} ${type}`).join(", ")}`);
  }
}

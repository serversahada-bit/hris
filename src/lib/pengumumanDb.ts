import db from "./db";
import "server-only";

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

  // Cek lewat information_schema (bukan ADD COLUMN IF NOT EXISTS) supaya jalan di MariaDB lokal & MySQL 8 production.
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman_hc' AND COLUMN_NAME = 'tanggal_pelaksanaan'`
    );
    if (Number((rows as { c: number }[])[0]?.c ?? 0) === 0) {
      await db.query(
        "ALTER TABLE pengumuman_hc ADD COLUMN tanggal_pelaksanaan DATE NULL AFTER lampiran, ADD INDEX (tanggal_pelaksanaan)"
      );
    }
  } catch (error) {
    console.warn("Skip migrasi kolom tanggal_pelaksanaan:", error);
  }
}

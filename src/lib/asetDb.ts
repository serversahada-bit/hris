import "server-only";
import db from "@/lib/db";

export async function ensureAsetTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS aset_kantor (
      id INT AUTO_INCREMENT PRIMARY KEY,
      kode_sistem VARCHAR(32) NOT NULL,
      nama_aset VARCHAR(255) NOT NULL,
      kode_aset VARCHAR(50) NULL,
      kategori VARCHAR(100) NOT NULL,
      merk VARCHAR(100) NULL,
      tipe VARCHAR(100) NULL,
      produsen VARCHAR(100) NULL,
      no_seri VARCHAR(100) NULL,
      tahun_produksi VARCHAR(10) NULL,
      deskripsi TEXT NULL,
      toko_distributor VARCHAR(255) NULL,
      no_invoice VARCHAR(100) NULL,
      tanggal_pembelian DATE NULL,
      jumlah INT NOT NULL DEFAULT 1,
      harga_satuan DECIMAL(15,2) NOT NULL DEFAULT 0,
      umur_ekonomis_tahun INT NOT NULL DEFAULT 1,
      kondisi VARCHAR(30) NOT NULL DEFAULT 'Baik',
      lokasi VARCHAR(255) NULL,
      penanggung_jawab VARCHAR(255) NULL,
      catatan TEXT NULL,
      foto VARCHAR(255) NULL,
      interval_perawatan_hari INT NULL,
      tanggal_perawatan_terakhir DATE NULL,
      created_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      UNIQUE KEY (kode_sistem),
      INDEX (kategori),
      INDEX (kondisi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`ALTER TABLE aset_kantor ADD COLUMN IF NOT EXISTS interval_perawatan_hari INT NULL`);
  await db.query(`ALTER TABLE aset_kantor ADD COLUMN IF NOT EXISTS tanggal_perawatan_terakhir DATE NULL`);
}

export async function ensureRiwayatKeuanganTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS aset_riwayat (
      id INT AUTO_INCREMENT PRIMARY KEY,
      aset_id INT NOT NULL,
      sejak_tanggal DATE NOT NULL,
      penanggung_jawab VARCHAR(255) NOT NULL,
      lokasi VARCHAR(255) NOT NULL,
      jumlah INT NOT NULL DEFAULT 1,
      kondisi_persen INT NOT NULL DEFAULT 100,
      kelengkapan_persen INT NOT NULL DEFAULT 100,
      keterangan TEXT NULL,
      created_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      INDEX (aset_id),
      CONSTRAINT fk_aset_riwayat_aset FOREIGN KEY (aset_id) REFERENCES aset_kantor(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS aset_keuangan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      aset_id INT NOT NULL,
      tanggal DATE NOT NULL,
      nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
      keterangan VARCHAR(255) NOT NULL,
      created_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      INDEX (aset_id),
      CONSTRAINT fk_aset_keuangan_aset FOREIGN KEY (aset_id) REFERENCES aset_kantor(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

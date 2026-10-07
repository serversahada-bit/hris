-- Setup tabel untuk fitur Pengajuan Dokumen Peraturan Perusahaan oleh karyawan
-- Jalankan file ini di MySQL/MariaDB kamu (mis. via phpMyAdmin > Import, atau `mysql -u root -p < sql/pengajuan_peraturan.sql`)
-- Nama database mengikuti DB_NAME di .env.local

CREATE DATABASE IF NOT EXISTS `default` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `default`;

-- Flow: karyawan upload PDF di absen-main -> Pending
--       -> (HC approve) -> Disetujui, dokumen disalin ke peraturan_perusahaan (peraturan_id terisi)
--       -> (HC reject, wajib isi catatan_admin) -> Ditolak, file PDF dihapus
-- File PDF disimpan di folder peraturan yang sama (PERATURAN_UPLOAD_DIR / LEGACY_UPLOAD_DIR/peraturan),
-- tapi baru tampil di daftar Peraturan Perusahaan setelah disetujui.
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Setup tabel untuk fitur Legalitas (approval pengajuan legalitas dokumen karyawan)
-- Jalankan file ini di MySQL/MariaDB kamu (mis. via phpMyAdmin > Import, atau `mysql -u root -p < sql/legalitas.sql`)
-- Nama database mengikuti DB_NAME di .env.local

CREATE DATABASE IF NOT EXISTS `default` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `default`;

-- Flow: Pending -> (HRD proses, isi estimasi hari) -> Diproses -> (HRD upload dokumen hasil) -> Selesai
--                -> (HRD tolak, isi catatan) -> Ditolak
CREATE TABLE IF NOT EXISTS pengajuan_legalitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  karyawan_id INT NOT NULL,
  jenis_dokumen VARCHAR(50) NOT NULL,
  keterangan TEXT NULL,
  file_pdf VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Diproses', 'Selesai', 'Ditolak') NOT NULL DEFAULT 'Pending',
  catatan_admin VARCHAR(255) NULL,
  estimasi_hari INT NULL,
  diproses_at DATETIME NULL,
  file_hasil VARCHAR(255) NULL,
  selesai_at DATETIME NULL,
  manager_id INT NULL,
  manager_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_karyawan (karyawan_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Jika tabel sudah ada dari versi sebelumnya (status hanya Pending/Disetujui/Ditolak),
-- jalankan migrasi ini untuk menambahkan alur "Diproses -> Selesai":
-- ALTER TABLE pengajuan_legalitas MODIFY status ENUM('Pending','Diproses','Selesai','Ditolak') NOT NULL DEFAULT 'Pending';
-- ALTER TABLE pengajuan_legalitas ADD COLUMN estimasi_hari INT NULL AFTER catatan_admin;
-- ALTER TABLE pengajuan_legalitas ADD COLUMN diproses_at DATETIME NULL AFTER estimasi_hari;
-- ALTER TABLE pengajuan_legalitas ADD COLUMN file_hasil VARCHAR(255) NULL AFTER diproses_at;
-- ALTER TABLE pengajuan_legalitas ADD COLUMN selesai_at DATETIME NULL AFTER file_hasil;

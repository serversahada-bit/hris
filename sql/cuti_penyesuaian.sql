-- Setup tabel untuk fitur Edit Cuti & Catatan di halaman Cuti Tahunan
-- (penyesuaian manual kuota cuti per karyawan per tahun + catatan HC)
-- Jalankan file ini di MySQL/MariaDB kamu (mis. via phpMyAdmin > Import, atau `mysql -u root -p < sql/cuti_penyesuaian.sql`)
-- Nama database mengikuti DB_NAME di .env.local

CREATE DATABASE IF NOT EXISTS `default` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `default`;

CREATE TABLE IF NOT EXISTS cuti_penyesuaian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  karyawan_id INT NOT NULL,
  tahun INT NOT NULL,
  penyesuaian_hari DECIMAL(5,1) NOT NULL DEFAULT 0,
  terpakai_override DECIMAL(5,1) NULL,
  catatan TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_karyawan_tahun (karyawan_id, tahun),
  INDEX idx_karyawan (karyawan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Jika tabel sudah pernah dibuat sebelum kolom ini ditambahkan, jalankan ALTER di bawah ini saja:
ALTER TABLE cuti_penyesuaian ADD COLUMN IF NOT EXISTS terpakai_override DECIMAL(5,1) NULL AFTER penyesuaian_hari;

-- Migrasi fitur Revisi pada Pengajuan Legalitas
-- Jalankan file ini di MySQL/MariaDB kamu (mis. via phpMyAdmin > Import, atau `mysql -u root -p < sql/legalitas_revisi.sql`)
-- Nama database mengikuti DB_NAME di .env.local
-- Tabel ini dipakai bersama absen-main: deploy kode kedua app setelah migrasi ini dijalankan.

CREATE DATABASE IF NOT EXISTS `default` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `default`;

-- Flow tambahan: Pending/Diproses -> (HC minta revisi, wajib catatan, PDF opsional) -> Revisi
--                Revisi -> (karyawan upload ulang PDF di absen-main) -> Pending
-- Hanya revisi terakhir yang disimpan (catatan_revisi & file_revisi ditimpa tiap revisi baru).
ALTER TABLE pengajuan_legalitas
  MODIFY status ENUM('Pending', 'Diproses', 'Revisi', 'Selesai', 'Ditolak') NOT NULL DEFAULT 'Pending',
  ADD COLUMN catatan_revisi TEXT NULL AFTER catatan_admin,
  ADD COLUMN file_revisi VARCHAR(255) NULL AFTER catatan_revisi,
  ADD COLUMN revisi_at DATETIME NULL AFTER file_revisi,
  ADD COLUMN revisi_dikirim_at DATETIME NULL AFTER revisi_at,
  ADD COLUMN jumlah_revisi INT NOT NULL DEFAULT 0 AFTER revisi_dikirim_at;

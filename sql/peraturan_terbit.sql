-- Migrasi fitur Jadwal Terbit Peraturan Perusahaan (batch jam 15:00 WIB, wajib dibaca di Great sebelum absen)
-- Jalankan file ini di MySQL/MariaDB kamu (mis. via phpMyAdmin > Import, atau `mysql -u root -p < sql/peraturan_terbit.sql`)
-- Nama database mengikuti DB_NAME di .env.local
-- dashboard-hris juga menjalankan migrasi ini otomatis (ensurePeraturanTables) saat halaman Peraturan Perusahaan dibuka.
-- Tabel ini dipakai bersama absen-main: jalankan migrasi sebelum deploy absen-main.

CREATE DATABASE IF NOT EXISTS `default` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `default`;

-- terbit_at (WIB): dokumen yang disetujui/diupload sebelum 15:00 terbit hari itu jam 15:00, sisanya besok jam 15:00.
--   Sebelum terbit_at dokumen tidak tampil di Great; sejak terbit_at karyawan wajib membacanya sebelum absen.
--   NULL = dokumen lama sebelum fitur ini — langsung tampil, tanpa popup wajib baca.
-- push_terkirim_at diisi saat push batch terkirim (cron /api/cron/push-pengumuman).
ALTER TABLE peraturan_perusahaan
  ADD COLUMN terbit_at DATETIME NULL AFTER uploaded_at,
  ADD COLUMN push_terkirim_at DATETIME NULL AFTER terbit_at,
  ADD INDEX (terbit_at);

-- Satu baris per karyawan yang sudah klik "Saya sudah membaca" (ditulis absen-main, jam WIB).
CREATE TABLE IF NOT EXISTS peraturan_perusahaan_baca (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peraturan_id INT NOT NULL,
  karyawan_id INT NOT NULL,
  dibaca_at DATETIME NOT NULL,
  UNIQUE KEY uniq_peraturan_karyawan (peraturan_id, karyawan_id),
  INDEX (karyawan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

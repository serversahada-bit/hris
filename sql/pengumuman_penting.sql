-- Migrasi fitur Pengumuman Penting (wajib dibaca di Great sebelum absen)
-- Jalankan file ini di MySQL/MariaDB kamu (mis. via phpMyAdmin > Import, atau `mysql -u root -p < sql/pengumuman_penting.sql`)
-- Nama database mengikuti DB_NAME di .env.local
-- dashboard-hris juga menjalankan migrasi ini otomatis (ensurePengumumanTable) saat halaman Pengumuman HC dibuka.
-- Tabel ini dipakai bersama absen-main: jalankan migrasi sebelum deploy absen-main.

CREATE DATABASE IF NOT EXISTS `default` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `default`;

-- is_penting = 1: karyawan wajib baca di Great mulai tgl_notifikasi (WIB), sekaligus jadwal push-nya.
-- push_terkirim_at diisi saat push terkirim (cron /api/cron/push-pengumuman); NULL = belum/di-reset untuk dikirim ulang.
ALTER TABLE pengumuman_hc
  ADD COLUMN is_penting TINYINT(1) NOT NULL DEFAULT 0 AFTER tanggal_pelaksanaan,
  ADD COLUMN tgl_notifikasi DATE NULL AFTER is_penting,
  ADD COLUMN push_terkirim_at DATETIME NULL AFTER tgl_notifikasi,
  ADD INDEX (tgl_notifikasi);

-- Satu baris per karyawan yang sudah klik "Saya sudah membaca" (ditulis absen-main, jam WIB).
-- Dihapus semua untuk pengumuman tsb saat HC mengubah judul/isi/lampiran (wajib baca ulang).
CREATE TABLE IF NOT EXISTS pengumuman_hc_baca (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pengumuman_id INT NOT NULL,
  karyawan_id INT NOT NULL,
  dibaca_at DATETIME NOT NULL,
  UNIQUE KEY uniq_pengumuman_karyawan (pengumuman_id, karyawan_id),
  INDEX (karyawan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

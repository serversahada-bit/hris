-- Setup tabel untuk fitur Ruang Meeting (approval pengajuan pemakaian ruang meeting karyawan)
-- Jalankan file ini di MySQL/MariaDB kamu (mis. via phpMyAdmin > Import, atau `mysql -u root -p < sql/ruang_meeting.sql`)
-- Nama database mengikuti DB_NAME di .env.local

CREATE DATABASE IF NOT EXISTS `default` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `default`;

-- Flow: Pending -> (HC approve) -> Disetujui
--                -> (HC reject, wajib isi catatan_admin) -> Ditolak
CREATE TABLE IF NOT EXISTS pengajuan_ruang_meeting (
  id INT AUTO_INCREMENT PRIMARY KEY,
  karyawan_id INT NOT NULL,
  tanggal DATE NOT NULL,
  kegiatan VARCHAR(255) NULL,
  jenis_aktifitas VARCHAR(100) NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  catatan TEXT NULL,
  status ENUM('Pending', 'Disetujui', 'Ditolak') NOT NULL DEFAULT 'Pending',
  catatan_admin VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_karyawan (karyawan_id),
  INDEX idx_status (status),
  INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

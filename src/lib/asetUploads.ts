import path from "path";
import "server-only";

// Foto aset disimpan di luar folder project (bukan public/uploads/aset bawaan)
// supaya tidak ikut hilang/tertimpa saat redeploy — pola yang sama dengan
// LEGACY_UPLOAD_DIR di legacyUploads.ts. Set ASET_UPLOAD_DIR di server ke
// folder persisten, mis. /data/data_kantor/hrd/upload/aset, lalu pastikan
// proses Node punya izin tulis ke folder itu.
export const ASET_UPLOAD_DIR =
  process.env.ASET_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "aset");

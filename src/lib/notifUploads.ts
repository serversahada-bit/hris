import path from "path";
import "server-only";

// Gambar notifikasi disimpan di luar folder project (bukan public/uploads/notifikasi
// bawaan) supaya tidak ikut hilang/tertimpa saat redeploy — pola yang sama dengan
// ASET_UPLOAD_DIR di asetUploads.ts. Set NOTIF_UPLOAD_DIR di server ke folder
// persisten, mis. /data/data_kantor/hrd/upload/notifikasi.
export const NOTIF_UPLOAD_DIR =
  process.env.NOTIF_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "notifikasi");

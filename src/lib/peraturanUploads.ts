import path from "path";
import "server-only";

// PDF peraturan disimpan di luar folder project (bukan public/uploads/peraturan
// bawaan) supaya tidak ikut hilang/tertimpa saat redeploy — pola yang sama dengan
// ASET_UPLOAD_DIR di asetUploads.ts. Set PERATURAN_UPLOAD_DIR di server ke folder
// persisten, mis. /data/data_kantor/hrd/upload/peraturan.
export const PERATURAN_UPLOAD_DIR =
  process.env.PERATURAN_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "peraturan");

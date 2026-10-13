import path from "path";
import "server-only";

// Lampiran pengumuman disimpan di folder persisten yang sama dengan absen-main
// (LEGACY_UPLOAD_DIR/pengumuman) supaya bisa ditampilkan di dashboard Great dan
// tidak hilang saat redeploy — pola yang sama dengan PERATURAN_UPLOAD_DIR. Set
// PENGUMUMAN_UPLOAD_DIR di server, mis. /data/data_kantor/hrd/upload/pengumuman.
export const PENGUMUMAN_UPLOAD_DIR =
  process.env.PENGUMUMAN_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "pengumuman");

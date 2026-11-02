import db from "./db";
import "server-only";
import type { ResultSetHeader } from "mysql2";
import { PushBroadcastError, sendPushBroadcast } from "./push";
import { nowWibDb } from "./pengumumanDb";

type TerbitRow = { id: number; judul: string };

export type HasilPushPeraturan = { jumlah: number; judul: string[]; error?: string };

/**
 * Kirim satu push untuk semua dokumen peraturan yang terbit_at-nya (WIB) sudah tiba tapi belum di-push,
 * jadi dokumen yang terbit bersamaan jam 15:00 cukup satu notifikasi. Dipanggil cron (/api/cron/push-pengumuman).
 * Tiap baris diklaim dulu lewat UPDATE ... WHERE push_terkirim_at IS NULL supaya cron yang jalan bersamaan
 * tidak mengirim dobel. Push yang gagal tidak diulang otomatis.
 */
export async function kirimPushPeraturanTerbit(): Promise<HasilPushPeraturan | null> {
  const now = nowWibDb();
  const [rows] = await db.query(
    `SELECT id, judul FROM peraturan_perusahaan
     WHERE terbit_at IS NOT NULL AND terbit_at <= ? AND push_terkirim_at IS NULL
     ORDER BY terbit_at ASC, id ASC`,
    [now]
  );

  const judul: string[] = [];
  for (const row of rows as TerbitRow[]) {
    const [claim] = await db.query(
      "UPDATE peraturan_perusahaan SET push_terkirim_at = ? WHERE id = ? AND push_terkirim_at IS NULL",
      [now, row.id]
    );
    if ((claim as ResultSetHeader).affectedRows === 1) judul.push(row.judul);
  }
  if (judul.length === 0) return null;

  try {
    await sendPushBroadcast({
      title: judul.length === 1 ? "📄 Dokumen Baru di Peraturan Perusahaan" : `📄 ${judul.length} Dokumen Baru di Peraturan Perusahaan`,
      body: `${judul.join(", ")}\nWajib dibaca sebelum absen.`,
      url: "/dashboard",
    });
    return { jumlah: judul.length, judul };
  } catch (error) {
    console.error("[Peraturan] Gagal mengirim push dokumen terbit:", error);
    const message = error instanceof PushBroadcastError ? error.message : "Gagal mengirim notifikasi.";
    return { jumlah: judul.length, judul, error: message };
  }
}

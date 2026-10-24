import db from "./db";
import "server-only";
import type { ResultSetHeader } from "mysql2";
import { PushBroadcastError, sendPushBroadcast } from "./push";
import { nowWibDb, todayWib } from "./pengumumanDb";

const PUSH_BODY_MAX = 120;

export function formatTanggalPush(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

export async function broadcastPengumuman(judul: string, isi: string, tanggalPelaksanaan: string, penting = false) {
  const ringkas = isi.length > PUSH_BODY_MAX ? `${isi.slice(0, PUSH_BODY_MAX).trimEnd()}…` : isi;
  await sendPushBroadcast({
    title: `${penting ? "⚠️ PENTING: " : "📢 "}${judul}`,
    body: `${formatTanggalPush(tanggalPelaksanaan)}\n${ringkas}`,
    url: "/dashboard",
  });
}

type JatuhTempoRow = { id: number; judul: string; isi: string; tanggal_pelaksanaan: string };

export type HasilPushPenting = { id: number; judul: string; error?: string };

/**
 * Kirim push untuk pengumuman penting yang tgl_notifikasi-nya (WIB) sudah tiba tapi belum di-push.
 * Dipanggil cron (/api/cron/push-pengumuman) dan langsung saat HC menyimpan pengumuman.
 * Tiap baris diklaim dulu lewat UPDATE ... WHERE push_terkirim_at IS NULL supaya cron dan simpan
 * manual yang jalan bersamaan tidak mengirim dobel. Push yang gagal tidak diulang otomatis.
 */
export async function kirimPushPengumumanPenting(id?: number): Promise<HasilPushPenting[]> {
  const [rows] = await db.query(
    `SELECT id, judul, isi, DATE_FORMAT(tanggal_pelaksanaan, '%Y-%m-%d') AS tanggal_pelaksanaan
     FROM pengumuman_hc
     WHERE is_penting = 1 AND push_terkirim_at IS NULL AND tgl_notifikasi <= ?${id ? " AND id = ?" : ""}
     ORDER BY tgl_notifikasi ASC, id ASC`,
    id ? [todayWib(), id] : [todayWib()]
  );

  const hasil: HasilPushPenting[] = [];
  for (const row of rows as JatuhTempoRow[]) {
    const [claim] = await db.query(
      "UPDATE pengumuman_hc SET push_terkirim_at = ? WHERE id = ? AND push_terkirim_at IS NULL",
      [nowWibDb(), row.id]
    );
    if ((claim as ResultSetHeader).affectedRows !== 1) continue;

    try {
      await broadcastPengumuman(row.judul, row.isi, row.tanggal_pelaksanaan, true);
      hasil.push({ id: row.id, judul: row.judul });
    } catch (error) {
      console.error(`[Pengumuman] Gagal mengirim push pengumuman penting #${row.id}:`, error);
      const message = error instanceof PushBroadcastError ? error.message : "Gagal mengirim notifikasi.";
      hasil.push({ id: row.id, judul: row.judul, error: message });
    }
  }
  return hasil;
}

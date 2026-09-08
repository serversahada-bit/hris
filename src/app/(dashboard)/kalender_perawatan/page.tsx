import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import KalenderPerawatanClient from "./KalenderPerawatanClient";

export const metadata = {
  title: "Kalender Perawatan - Great HRD Workspace",
  description: "Jadwal perawatan aset dan fasilitas kantor.",
};

export const revalidate = 0;

type AsetRowRaw = {
  id: number;
  nama_aset: string;
  kategori: string;
  lokasi: string | null;
  tanggal_servis_terakhir: string | Date | null;
  tanggal_servis_berikutnya: string | Date;
  catatan: string | null;
};

export type AsetItem = {
  id: number;
  nama_aset: string;
  kategori: string;
  lokasi: string | null;
  tanggal_servis_terakhir: string | null;
  tanggal_servis_berikutnya: string;
  catatan: string | null;
};

function toDateInputValue(value: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export default async function KalenderPerawatanPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  let items: AsetItem[] = [];

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS aset_perawatan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_aset VARCHAR(255) NOT NULL,
        kategori VARCHAR(50) NOT NULL,
        lokasi VARCHAR(255) NULL,
        tanggal_servis_terakhir DATE NULL,
        tanggal_servis_berikutnya DATE NOT NULL,
        catatan TEXT NULL,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL,
        INDEX (tanggal_servis_berikutnya)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [rows] = await db.query(
      `SELECT id, nama_aset, kategori, lokasi, tanggal_servis_terakhir, tanggal_servis_berikutnya, catatan
       FROM aset_perawatan
       ORDER BY tanggal_servis_berikutnya ASC`
    );

    items = (rows as AsetRowRaw[]).map((row) => ({
      id: row.id,
      nama_aset: row.nama_aset,
      kategori: row.kategori,
      lokasi: row.lokasi,
      tanggal_servis_terakhir: toDateInputValue(row.tanggal_servis_terakhir),
      tanggal_servis_berikutnya: toDateInputValue(row.tanggal_servis_berikutnya) as string,
      catatan: row.catatan,
    }));
  } catch (error) {
    console.error("Failed to fetch aset perawatan:", error);
  }

  return <KalenderPerawatanClient items={items} />;
}

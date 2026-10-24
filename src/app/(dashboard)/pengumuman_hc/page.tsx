import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ensurePengumumanTable, KARYAWAN_WAJIB_BACA_SQL } from "@/lib/pengumumanDb";
import PengumumanClient from "./PengumumanClient";

export const metadata = {
  title: "Pengumuman HC - Great HRD Workspace",
  description: "Broadcast pengumuman HC untuk karyawan.",
};

export const revalidate = 0;

type PengumumanRow = {
  id: number;
  judul: string;
  isi: string;
  lampiran: string | null;
  tanggal_pelaksanaan: string | null;
  is_penting: number;
  tgl_notifikasi: string | null;
  push_terkirim_at: string | null;
  created_at: string | Date;
  updated_at: string | Date | null;
};

export type PengumumanItem = {
  id: number;
  judul: string;
  isi: string;
  lampiran: string | null;
  lampiranUrl: string | null;
  tanggalPelaksanaan: string | null;
  tanggalPelaksanaanLabel: string | null;
  isPenting: boolean;
  tglNotifikasi: string | null;
  tglNotifikasiLabel: string | null;
  pushTerkirimAt: string | null;
  jumlahWajib: number;
  jumlahSudahBaca: number;
  createdAt: string;
  updatedAt: string | null;
};

function formatDate(value: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const datePart = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${datePart} ${timePart}`;
}

function formatTanggal(value: string | null) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

export default async function PengumumanHcPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  let items: PengumumanItem[] = [];

  try {
    await ensurePengumumanTable();

    const [rows] = await db.query(
      `SELECT id, judul, isi, lampiran, DATE_FORMAT(tanggal_pelaksanaan, '%Y-%m-%d') AS tanggal_pelaksanaan,
              is_penting, DATE_FORMAT(tgl_notifikasi, '%Y-%m-%d') AS tgl_notifikasi,
              DATE_FORMAT(push_terkirim_at, '%d/%m/%Y %H:%i') AS push_terkirim_at, created_at, updated_at
       FROM pengumuman_hc ORDER BY created_at DESC`
    );

    // Progres baca pengumuman penting: wajib = karyawan aktif yang sudah bergabung per tgl_notifikasi.
    const [progresRows] = await db.query(
      `SELECT p.id, COUNT(k.id) AS wajib, COUNT(b.id) AS sudah
       FROM pengumuman_hc p
       JOIN karyawan k ON ${KARYAWAN_WAJIB_BACA_SQL}
       LEFT JOIN pengumuman_hc_baca b ON b.pengumuman_id = p.id AND b.karyawan_id = k.id
       WHERE p.is_penting = 1
       GROUP BY p.id`
    );
    const progres = new Map(
      (progresRows as { id: number; wajib: number; sudah: number }[]).map((row) => [row.id, row])
    );

    items = (rows as PengumumanRow[]).map((row) => ({
      id: row.id,
      judul: row.judul,
      isi: row.isi,
      lampiran: row.lampiran,
      lampiranUrl: row.lampiran ? `/api/pengumuman-uploads/${encodeURIComponent(row.lampiran)}` : null,
      tanggalPelaksanaan: row.tanggal_pelaksanaan,
      tanggalPelaksanaanLabel: formatTanggal(row.tanggal_pelaksanaan),
      isPenting: Boolean(row.is_penting),
      tglNotifikasi: row.tgl_notifikasi,
      tglNotifikasiLabel: formatTanggal(row.tgl_notifikasi),
      pushTerkirimAt: row.push_terkirim_at,
      jumlahWajib: Number(progres.get(row.id)?.wajib ?? 0),
      jumlahSudahBaca: Number(progres.get(row.id)?.sudah ?? 0),
      createdAt: formatDate(row.created_at) ?? "-",
      updatedAt: formatDate(row.updated_at),
    }));
  } catch (error) {
    console.error("Failed to fetch pengumuman:", error);
  }

  return <PengumumanClient items={items} />;
}

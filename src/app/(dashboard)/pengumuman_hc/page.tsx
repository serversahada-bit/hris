import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ensurePengumumanTable } from "@/lib/pengumumanDb";
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
      `SELECT id, judul, isi, lampiran, DATE_FORMAT(tanggal_pelaksanaan, '%Y-%m-%d') AS tanggal_pelaksanaan, created_at, updated_at
       FROM pengumuman_hc ORDER BY created_at DESC`
    );

    items = (rows as PengumumanRow[]).map((row) => ({
      id: row.id,
      judul: row.judul,
      isi: row.isi,
      lampiran: row.lampiran,
      lampiranUrl: row.lampiran ? `/api/pengumuman-uploads/${encodeURIComponent(row.lampiran)}` : null,
      tanggalPelaksanaan: row.tanggal_pelaksanaan,
      tanggalPelaksanaanLabel: formatTanggal(row.tanggal_pelaksanaan),
      createdAt: formatDate(row.created_at) ?? "-",
      updatedAt: formatDate(row.updated_at),
    }));
  } catch (error) {
    console.error("Failed to fetch pengumuman:", error);
  }

  return <PengumumanClient items={items} />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
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
  created_at: string | Date;
  updated_at: string | Date | null;
};

export type PengumumanItem = {
  id: number;
  judul: string;
  isi: string;
  lampiran: string | null;
  lampiranUrl: string | null;
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

export default async function PengumumanHcPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  let items: PengumumanItem[] = [];

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pengumuman_hc (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        isi TEXT NOT NULL,
        lampiran VARCHAR(255) NULL,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL,
        INDEX (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [rows] = await db.query(
      "SELECT id, judul, isi, lampiran, created_at, updated_at FROM pengumuman_hc ORDER BY created_at DESC"
    );

    items = (rows as PengumumanRow[]).map((row) => ({
      id: row.id,
      judul: row.judul,
      isi: row.isi,
      lampiran: row.lampiran,
      lampiranUrl: row.lampiran ? `/uploads/pengumuman/${encodeURIComponent(row.lampiran)}` : null,
      createdAt: formatDate(row.created_at) ?? "-",
      updatedAt: formatDate(row.updated_at),
    }));
  } catch (error) {
    console.error("Failed to fetch pengumuman:", error);
  }

  return <PengumumanClient items={items} />;
}

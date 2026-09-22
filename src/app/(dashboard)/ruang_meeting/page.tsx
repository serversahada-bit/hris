import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import RuangMeetingClient, { type RuangMeetingRow } from "./RuangMeetingClient";

export const metadata = {
  title: "Ruang Meeting - Great HRIS",
  description: "Kelola approval pengajuan ruang meeting karyawan.",
};

export const revalidate = 0;

function formatDateOnly(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value);
}

function normalizeStatus(value?: string): "Pending" | "Disetujui" | "Ditolak" | "Semua" {
  const allowed = ["Pending", "Disetujui", "Ditolak", "Semua"] as const;
  if (allowed.includes(value as (typeof allowed)[number])) {
    return value as (typeof allowed)[number];
  }
  return "Pending";
}

export default async function RuangMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  const selectedStatus = normalizeStatus(typeof params.status === "string" ? params.status : undefined);

  let sql = `SELECT r.*, k.nama
             FROM pengajuan_ruang_meeting r
             LEFT JOIN karyawan k ON k.id = r.karyawan_id`;

  const queryParams: string[] = [];

  if (selectedStatus !== "Semua") {
    sql += ` WHERE r.status = ?`;
    queryParams.push(selectedStatus);
  }

  sql += ` ORDER BY r.tanggal DESC, r.jam_mulai DESC`;

  let rows: RuangMeetingRow[] = [];

  try {
    const [result] = await db.query(sql, queryParams);
    rows = (result as Array<Record<string, unknown>>).map((row) => ({
      id: Number(row.id),
      karyawan_id: Number(row.karyawan_id),
      nama: (row.nama as string | null) ?? null,
      tanggal: formatDateOnly(row.tanggal),
      kegiatan: (row.kegiatan as string | null) ?? null,
      jenis_aktifitas: (row.jenis_aktifitas as string | null) ?? null,
      jam_mulai: (row.jam_mulai as string | null) ?? null,
      jam_selesai: (row.jam_selesai as string | null) ?? null,
      catatan: (row.catatan as string | null) ?? null,
      status: (row.status as string | null) ?? "Pending",
      catatan_admin: (row.catatan_admin as string | null) ?? null,
      created_at: row.created_at ? String(row.created_at) : null,
    }));
  } catch (error) {
    console.error("Failed to fetch pengajuan ruang meeting:", error);
  }

  return <RuangMeetingClient rows={rows} selectedStatus={selectedStatus} />;
}

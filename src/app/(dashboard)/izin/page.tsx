import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import IzinClient, { type IzinRow } from "./IzinClient";

export const metadata = {
  title: "Izin & Cuti - Great HRIS",
  description: "Kelola approval izin dan cuti karyawan.",
};

export const revalidate = 0;

const BUKTI_HOST = "https://great.ptslu.id";
const BUKTI_DIR_WEB = `${BUKTI_HOST}/uploads/izin/`;

function toDateOnly(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function safeBasename(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\?.*$/, "").split("/").pop() || "";
}

function normalizeStatus(value?: string): "Menunggu Manager" | "Pending" | "Disetujui" | "Ditolak" | "Semua" {
  const allowed = ["Menunggu Manager", "Pending", "Disetujui", "Ditolak", "Semua"] as const;
  if (allowed.includes(value as (typeof allowed)[number])) {
    return value as (typeof allowed)[number];
  }
  return "Pending";
}

export default async function IzinPage({
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

  let sql = `SELECT i.*, k.nama, k.foto
             FROM pengajuan_izin i
             LEFT JOIN karyawan k ON k.id = i.karyawan_id`;

  const where: string[] = ["(k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)"];

  if (selectedStatus === "Menunggu Manager") {
    where.push("i.status = 'Pending'");
    where.push("(i.manager_status IS NULL OR i.manager_status = 'Pending')");
  } else if (selectedStatus === "Pending") {
    where.push("i.status = 'Pending'");
    where.push("i.manager_status = 'Disetujui'");
  } else if (selectedStatus === "Disetujui") {
    where.push("i.status = 'Disetujui'");
  } else if (selectedStatus === "Ditolak") {
    where.push("(i.status = 'Ditolak' OR i.manager_status = 'Ditolak')");
  }

  sql += ` WHERE ${where.join(" AND ")} ORDER BY i.created_at DESC`;

  let rows: IzinRow[] = [];

  try {
    const [result] = await db.query(sql);
    rows = (result as Array<Record<string, unknown>>).map((row) => {
      const fileBukti = safeBasename(row.bukti_foto as string | null);
      return {
        id: Number(row.id),
        karyawan_id: Number(row.karyawan_id),
        nama: (row.nama as string | null) ?? null,
        foto: (row.foto as string | null) ?? null,
        tipe_izin: (row.tipe_izin as string | null) ?? null,
        mulai_tanggal: toDateOnly(row.mulai_tanggal),
        sampai_tanggal: toDateOnly(row.sampai_tanggal),
        alasan: (row.alasan as string | null) ?? null,
        status: (row.status as string | null) ?? "Pending",
        created_at: row.created_at ? String(row.created_at) : null,
        bukti_foto: (row.bukti_foto as string | null) ?? null,
        manager_status: (row.manager_status as string | null) ?? "Pending",
        manager_note: (row.manager_note as string | null) ?? null,
        manager_at: row.manager_at ? String(row.manager_at) : null,
        catatan_admin: (row.catatan_admin as string | null) ?? null,
        bukti_url: fileBukti ? `${BUKTI_DIR_WEB}${encodeURIComponent(fileBukti)}` : "",
      };
    });
  } catch (error) {
    console.error("Failed to fetch izin rows:", error);
  }

  return <IzinClient rows={rows} selectedStatus={selectedStatus} />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import LegalitasClient, { type LegalitasRow } from "./LegalitasClient";

export const metadata = {
  title: "Legalitas - Great HRIS",
  description: "Kelola approval pengajuan legalitas dokumen karyawan.",
};

export const revalidate = 0;

const FILE_DIR_WEB = "/api/legacy-files/uploads/legalitas/";
const FILE_HASIL_DIR_WEB = "/uploads/legalitas_hasil/";

function toDateTimeDisplay(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return dateTimeFormatter.format(date).replace(/\./g, ":");
}

function safeBasename(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\?.*$/, "").split("/").pop() || "";
}

function normalizeStatus(value?: string): "Pending" | "Diproses" | "Selesai" | "Ditolak" | "Semua" {
  const allowed = ["Pending", "Diproses", "Selesai", "Ditolak", "Semua"] as const;
  if (allowed.includes(value as (typeof allowed)[number])) {
    return value as (typeof allowed)[number];
  }
  return "Pending";
}

export default async function LegalitasPage({
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

  let sql = `SELECT pl.*, k.nama, k.foto
             FROM pengajuan_legalitas pl
             LEFT JOIN karyawan k ON k.id = pl.karyawan_id`;

  const where: string[] = ["(k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)"];

  if (selectedStatus !== "Semua") {
    where.push("pl.status = ?");
  }

  sql += ` WHERE ${where.join(" AND ")} ORDER BY pl.created_at DESC`;

  let rows: LegalitasRow[] = [];

  try {
    const queryParams = selectedStatus !== "Semua" ? [selectedStatus] : [];
    const [result] = await db.query(sql, queryParams);
    rows = (result as Array<Record<string, unknown>>).map((row) => {
      const file = safeBasename(row.file_pdf as string | null);
      const fileHasil = safeBasename(row.file_hasil as string | null);
      return {
        id: Number(row.id),
        karyawan_id: Number(row.karyawan_id),
        nama: (row.nama as string | null) ?? null,
        jenis_dokumen: (row.jenis_dokumen as string | null) ?? null,
        keterangan: (row.keterangan as string | null) ?? null,
        status: (row.status as string | null) ?? "Pending",
        catatan_admin: (row.catatan_admin as string | null) ?? null,
        estimasi_hari: row.estimasi_hari != null ? Number(row.estimasi_hari) : null,
        created_at: toDateTimeDisplay(row.created_at),
        diproses_at: toDateTimeDisplay(row.diproses_at),
        selesai_at: toDateTimeDisplay(row.selesai_at),
        manager_at: toDateTimeDisplay(row.manager_at),
        file_url: file ? `${FILE_DIR_WEB}${encodeURIComponent(file)}` : "",
        file_hasil_url: fileHasil ? `${FILE_HASIL_DIR_WEB}${encodeURIComponent(fileHasil)}` : "",
      };
    });
  } catch (error) {
    console.error("Failed to fetch pengajuan legalitas rows:", error);
  }

  return <LegalitasClient rows={rows} selectedStatus={selectedStatus} />;
}

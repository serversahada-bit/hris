import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { stat } from "fs/promises";
import path from "path";
import db from "@/lib/db";
import { PERATURAN_UPLOAD_DIR } from "@/lib/peraturanUploads";
import PeraturanClient from "./PeraturanClient";
import PengajuanPeraturanClient, { type PengajuanRow } from "./PengajuanPeraturanClient";
import PeraturanTabs from "./PeraturanTabs";

export const metadata = {
  title: "Aturan Perusahaan - Great HRD Workspace",
  description: "Upload dan kelola dokumen PDF peraturan perusahaan.",
};

export const revalidate = 0;

const UPLOAD_DIR_FS = PERATURAN_UPLOAD_DIR;

type DocRow = {
  id: number;
  judul: string | null;
  file: string;
  uploaded_at: string | null;
  pengaju_nama: string | null;
  pengaju_divisi: string | null;
};

export type DocItem = {
  id: number;
  judul: string;
  file: string;
  url: string;
  date: string;
  size: number | null;
  pengaju: string | null;
};

type StatusFilter = "Pending" | "Disetujui" | "Ditolak" | "Semua";

function normalizeStatus(value?: string): StatusFilter {
  const allowed = ["Pending", "Disetujui", "Ditolak", "Semua"] as const;
  if (allowed.includes(value as (typeof allowed)[number])) {
    return value as (typeof allowed)[number];
  }
  return "Pending";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${datePart} ${timePart}`;
}

function formatPengaju(nama: string | null, divisi: string | null) {
  if (!nama) return null;
  return divisi ? `${nama} - ${divisi}` : nama;
}

export default async function PeraturanPerusahaanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  const tab = params.tab === "pengajuan" ? "pengajuan" : "dokumen";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const view = typeof params.view === "string" ? params.view.trim() : "";
  const selectedStatus = normalizeStatus(typeof params.status === "string" ? params.status : undefined);

  let docs: DocItem[] = [];
  let pengajuanRows: PengajuanRow[] = [];
  let pendingCount = 0;

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS peraturan_perusahaan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        file VARCHAR(255) NOT NULL,
        uploaded_by INT NULL,
        uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (uploaded_at),
        INDEX (uploaded_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS pengajuan_peraturan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        karyawan_id INT NOT NULL,
        judul VARCHAR(255) NOT NULL,
        file VARCHAR(255) NOT NULL,
        catatan TEXT NULL,
        status ENUM('Pending', 'Disetujui', 'Ditolak') NOT NULL DEFAULT 'Pending',
        catatan_admin VARCHAR(255) NULL,
        peraturan_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME NULL,
        INDEX idx_karyawan (karyawan_id),
        INDEX idx_status (status),
        INDEX idx_peraturan (peraturan_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM pengajuan_peraturan WHERE status = 'Pending'"
    );
    pendingCount = Number((countRows as Array<{ total: number }>)[0]?.total ?? 0);
  } catch (error) {
    console.error("Failed to prepare peraturan perusahaan tables:", error);
  }

  if (tab === "dokumen") {
    try {
      let sql = `SELECT p.id, p.judul, p.file, p.uploaded_at, k.nama AS pengaju_nama, k.organisasi AS pengaju_divisi
                 FROM peraturan_perusahaan p
                 LEFT JOIN pengajuan_peraturan pp ON pp.peraturan_id = p.id
                 LEFT JOIN karyawan k ON k.id = pp.karyawan_id
                 WHERE p.file <> ''`;
      const sqlParams: string[] = [];
      if (q !== "") {
        sql += " AND (p.judul LIKE ? OR p.file LIKE ?)";
        sqlParams.push(`%${q}%`, `%${q}%`);
      }
      sql += " ORDER BY p.uploaded_at DESC, p.id DESC";

      const [rows] = await db.query(sql, sqlParams);

      docs = await Promise.all(
        (rows as DocRow[]).map(async (row) => {
          const file = row.file ?? "";
          let size: number | null = null;
          try {
            const info = await stat(path.join(UPLOAD_DIR_FS, file));
            size = info.size;
          } catch {
            size = null;
          }

          return {
            id: row.id,
            judul: row.judul || file,
            file,
            url: `/api/peraturan-uploads/${encodeURIComponent(file)}`,
            date: formatDate(row.uploaded_at),
            size,
            pengaju: formatPengaju(row.pengaju_nama, row.pengaju_divisi),
          };
        })
      );
    } catch (error) {
      console.error("Failed to fetch peraturan perusahaan:", error);
    }
  } else {
    try {
      let sql = `SELECT pp.*, k.nama, k.organisasi
                 FROM pengajuan_peraturan pp
                 LEFT JOIN karyawan k ON k.id = pp.karyawan_id`;
      const sqlParams: string[] = [];
      if (selectedStatus !== "Semua") {
        sql += " WHERE pp.status = ?";
        sqlParams.push(selectedStatus);
      }
      sql += " ORDER BY pp.created_at DESC, pp.id DESC";

      const [rows] = await db.query(sql, sqlParams);
      pengajuanRows = (rows as Array<Record<string, unknown>>).map((row) => {
        const file = String(row.file ?? "");
        return {
          id: Number(row.id),
          karyawan_id: Number(row.karyawan_id),
          nama: (row.nama as string | null) ?? null,
          divisi: (row.organisasi as string | null) ?? null,
          judul: (row.judul as string | null) ?? file,
          file,
          url: `/api/peraturan-uploads/${encodeURIComponent(file)}`,
          catatan: (row.catatan as string | null) ?? null,
          status: (row.status as string | null) ?? "Pending",
          catatan_admin: (row.catatan_admin as string | null) ?? null,
          created_at: formatDate(row.created_at ? String(row.created_at) : null),
          processed_at: row.processed_at ? formatDate(String(row.processed_at)) : null,
        };
      });
    } catch (error) {
      console.error("Failed to fetch pengajuan peraturan:", error);
    }
  }

  let viewUrl = "";
  let viewTitle = "";
  if (view !== "") {
    const found = docs.find((d) => d.file === view);
    if (found) {
      viewUrl = found.url;
      viewTitle = found.judul;
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <PeraturanTabs active={tab} pendingCount={pendingCount} />
      {tab === "pengajuan" ? (
        <PengajuanPeraturanClient rows={pengajuanRows} selectedStatus={selectedStatus} />
      ) : (
        <PeraturanClient docs={docs} q={q} viewUrl={viewUrl} viewTitle={viewTitle} viewFile={view} />
      )}
    </div>
  );
}

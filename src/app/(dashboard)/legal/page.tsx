import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { stat } from "fs/promises";
import path from "path";
import db from "@/lib/db";
import LegalClient from "./LegalClient";

export const metadata = {
  title: "Legal - Great HRD Workspace",
  description: "Dokumen legal perusahaan dan status masa berlakunya.",
};

export const revalidate = 0;

const UPLOAD_DIR_FS = path.join(process.cwd(), "public", "uploads", "legal");

type DocRow = {
  id: number;
  judul: string | null;
  kategori: string | null;
  file: string;
  tanggal_berlaku: string | Date | null;
  tanggal_kadaluarsa: string | Date | null;
  catatan: string | null;
  uploaded_at: string | Date | null;
};

export type LegalDoc = {
  id: number;
  judul: string;
  kategori: string;
  file: string;
  url: string;
  tanggal_berlaku: string | null;
  tanggal_kadaluarsa: string | null;
  catatan: string | null;
  date: string;
  size: number | null;
};

function toDateInputValue(value: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function formatDate(value: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const datePart = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${datePart} ${timePart}`;
}

export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const view = typeof params.view === "string" ? params.view.trim() : "";

  let docs: LegalDoc[] = [];

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS dokumen_legal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        kategori VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
        file VARCHAR(255) NOT NULL,
        tanggal_berlaku DATE NULL,
        tanggal_kadaluarsa DATE NULL,
        catatan TEXT NULL,
        uploaded_by INT NULL,
        uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (tanggal_kadaluarsa),
        INDEX (uploaded_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    let sql = "SELECT id, judul, kategori, file, tanggal_berlaku, tanggal_kadaluarsa, catatan, uploaded_at FROM dokumen_legal WHERE file <> ''";
    const sqlParams: string[] = [];
    if (q !== "") {
      sql += " AND (judul LIKE ? OR file LIKE ?)";
      sqlParams.push(`%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY tanggal_kadaluarsa IS NULL, tanggal_kadaluarsa ASC, uploaded_at DESC";

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
          kategori: row.kategori || "Lainnya",
          file,
          url: `/uploads/legal/${encodeURIComponent(file)}`,
          tanggal_berlaku: toDateInputValue(row.tanggal_berlaku),
          tanggal_kadaluarsa: toDateInputValue(row.tanggal_kadaluarsa),
          catatan: row.catatan,
          date: formatDate(row.uploaded_at),
          size,
        };
      })
    );
  } catch (error) {
    console.error("Failed to fetch dokumen legal:", error);
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

  return <LegalClient docs={docs} q={q} viewUrl={viewUrl} viewTitle={viewTitle} viewFile={view} />;
}

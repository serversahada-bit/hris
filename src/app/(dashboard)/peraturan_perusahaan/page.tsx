import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { stat } from "fs/promises";
import path from "path";
import db from "@/lib/db";
import PeraturanClient from "./PeraturanClient";

export const metadata = {
  title: "Aturan Perusahaan - Great HRD Workspace",
  description: "Upload dan kelola dokumen PDF peraturan perusahaan.",
};

export const revalidate = 0;

const UPLOAD_DIR_FS = path.join(process.cwd(), "public", "uploads", "peraturan");

type DocRow = {
  id: number;
  judul: string | null;
  file: string;
  uploaded_at: string | null;
};

export type DocItem = {
  id: number;
  judul: string;
  file: string;
  url: string;
  date: string;
  size: number | null;
};

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

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const view = typeof params.view === "string" ? params.view.trim() : "";

  let docs: DocItem[] = [];

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

    let sql = "SELECT id, judul, file, uploaded_at FROM peraturan_perusahaan WHERE file <> ''";
    const sqlParams: string[] = [];
    if (q !== "") {
      sql += " AND (judul LIKE ? OR file LIKE ?)";
      sqlParams.push(`%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY uploaded_at DESC, id DESC";

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
          url: `/uploads/peraturan/${encodeURIComponent(file)}`,
          date: formatDate(row.uploaded_at),
          size,
        };
      })
    );
  } catch (error) {
    console.error("Failed to fetch peraturan perusahaan:", error);
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
    <PeraturanClient docs={docs} q={q} viewUrl={viewUrl} viewTitle={viewTitle} viewFile={view} />
  );
}

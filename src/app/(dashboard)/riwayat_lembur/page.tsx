import db from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LemburClient from "./LemburClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RiwayatLemburPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("admin_id")?.value;

  if (!adminId) {
    redirect("/app");
  }

  const sp = await searchParams;
  
  let year = parseInt(sp.year || "");
  if (isNaN(year) || year < 2000 || year > 2100) {
    year = new Date().getFullYear();
  }

  let status = (sp.status || "ALL").toUpperCase();
  const allowedStatus = ["ALL", "PENDING", "APPROVED", "REJECTED"];
  if (!allowedStatus.includes(status)) status = "ALL";

  const q = sp.q || "";

  const yearStart = `${year}-01-01 00:00:00`;
  const yearEnd = `${year}-12-31 23:59:59`;

  const params: any[] = [yearStart, yearEnd];
  let where = " WHERE l.mulai_at BETWEEN ? AND ? ";

  if (status !== "ALL") {
    where += " AND l.status = ? ";
    params.push(status);
  }

  if (q) {
    where += " AND (k.nama LIKE ? OR l.alasan LIKE ? OR k.jabatan LIKE ? OR k.organisasi LIKE ?) ";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  let tableData = [];
  try {
    const [rows]: any = await db.query(
      `SELECT
          l.id, l.karyawan_id, l.mulai_at, l.selesai_at, l.durasi_menit, l.alasan,
          l.status, l.notes, l.approved_at,
          l.manager_status, l.manager_at, l.manager_notes,
          k.nama AS nama_karyawan, k.jabatan AS jabatan_karyawan, k.organisasi
        FROM lembur l
        JOIN karyawan k ON k.id = l.karyawan_id
        ${where}
        ORDER BY l.id DESC`,
      params
    );
    tableData = rows;
  } catch (error) {
    console.error("Failed to fetch lembur data", error);
  }

  const serializedData = tableData.map((row: any) => {
    const newRow = { ...row };
    if (newRow.mulai_at instanceof Date) newRow.mulai_at = newRow.mulai_at.toISOString();
    if (newRow.selesai_at instanceof Date) newRow.selesai_at = newRow.selesai_at.toISOString();
    if (newRow.approved_at instanceof Date) newRow.approved_at = newRow.approved_at.toISOString();
    if (newRow.manager_at instanceof Date) newRow.manager_at = newRow.manager_at.toISOString();
    return newRow;
  });

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Riwayat Pengajuan Lembur</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tabel diringkas. Alasan, catatan, dan detail tahap dipindah ke <b className="text-gray-700">Detail</b>.
          </p>
        </div>
      </div>
      
      <LemburClient 
        data={serializedData}
        currentParams={{ year: year.toString(), status, q }}
      />
    </div>
  );
}

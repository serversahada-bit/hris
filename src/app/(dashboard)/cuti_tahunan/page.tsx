import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import CutiTahunanClient, { type CutiRow } from "./CutiTahunanClient";

export const metadata = {
  title: "Data Cuti - Great HRIS",
  description: "Rekap jatah, terpakai, dan sisa cuti tahunan karyawan.",
};

export const revalidate = 0;

type EmployeeRow = {
  id: number;
  nama: string | null;
  jabatan: string | null;
  tanggal_bergabung: string | null;
  status_karyawan: string | null;
};

type LeaveRow = {
  karyawan_id: number | null;
  tipe_izin: string | null;
  status: string | null;
  mulai_tanggal: string | null;
  sampai_tanggal: string | null;
  durasi_hari: number | string | null;
};

type PenyesuaianRow = {
  karyawan_id: number | null;
  penyesuaian_hari: number | string | null;
  terpakai_override: number | string | null;
  catatan: string | null;
};

function normalizeYear(value?: string) {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 2000 && year <= 2100) {
    return year;
  }

  return new Date().getFullYear();
}

function formatDateDisplay(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return value;
}

function jatahCutiTahunan(tanggalBergabung: string | null, year: number) {
  if (!tanggalBergabung) return 0;

  const join = new Date(tanggalBergabung);
  if (Number.isNaN(join.getTime())) return 0;

  const anniv = new Date(join);
  anniv.setFullYear(anniv.getFullYear() + 1);

  const startYear = new Date(`${year}-01-01T00:00:00`);
  const endYear = new Date(`${year}-12-31T23:59:59`);

  if (anniv > endYear) return 0;
  if (anniv <= startYear) return 12;

  const month = anniv.getMonth() + 1;
  if (month === 1) return 12;

  return Math.max(0, Math.min(12, 12 - month));
}

function clampRangeToYear(start: Date, end: Date, year: number) {
  const yearStart = new Date(`${year}-01-01T00:00:00`);
  const yearEnd = new Date(`${year}-12-31T23:59:59`);

  const clampedStart = start < yearStart ? yearStart : start;
  const clampedEnd = end > yearEnd ? yearEnd : end;

  return [clampedStart, clampedEnd] as const;
}

function countInclusiveDays(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / 86400000) + 1;
}

export default async function CutiTahunanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  const year = normalizeYear(typeof params.year === "string" ? params.year : undefined);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  let employees: EmployeeRow[] = [];
  const usedByEmployee = new Map<number, number>();

  try {
    const [employeeRows] = await db.query(
      `SELECT id, nama, jabatan, tanggal_bergabung, status_karyawan
       FROM karyawan
       WHERE (status_karyawan IS NULL OR status_karyawan <> 'Non-Aktif')
       ORDER BY nama ASC`
    );
    employees = employeeRows as EmployeeRow[];
  } catch (error) {
    console.error("Failed to fetch employees for leave summary:", error);
  }

  try {
    const [leaveRows] = await db.query(
      `SELECT karyawan_id, tipe_izin, status, mulai_tanggal, sampai_tanggal, durasi_hari
       FROM pengajuan_izin
       WHERE mulai_tanggal BETWEEN ? AND ?`,
      [yearStart, yearEnd]
    );

    for (const row of leaveRows as LeaveRow[]) {
      const employeeId = Number(row.karyawan_id);
      if (!employeeId) continue;

      const type = String(row.tipe_izin ?? "").trim().toLowerCase();
      const status = String(row.status ?? "").trim().toLowerCase();
      const isCutiPenuh = type === "cuti";
      const isCutiSetengahHari = type === "cuti setengah hari";
      if ((!isCutiPenuh && !isCutiSetengahHari) || status !== "disetujui") continue;

      if (!row.mulai_tanggal) continue;

      let totalDays: number;

      if (isCutiSetengahHari) {
        const durasi = Number(row.durasi_hari);
        totalDays = Number.isFinite(durasi) && durasi > 0 ? durasi : 0.5;
      } else {
        const start = new Date(row.mulai_tanggal);
        const end = new Date(row.sampai_tanggal || row.mulai_tanggal);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

        const actualStart = start <= end ? start : end;
        const actualEnd = start <= end ? end : start;
        const [clampedStart, clampedEnd] = clampRangeToYear(actualStart, actualEnd, year);
        totalDays = countInclusiveDays(clampedStart, clampedEnd);
      }

      usedByEmployee.set(employeeId, (usedByEmployee.get(employeeId) ?? 0) + totalDays);
    }
  } catch (error) {
    console.error("Failed to fetch approved leave usage:", error);
  }

  const penyesuaianByEmployee = new Map<number, { hari: number; terpakaiOverride: number | null; catatan: string | null }>();

  try {
    const [penyesuaianRows] = await db.query(
      `SELECT karyawan_id, penyesuaian_hari, terpakai_override, catatan
       FROM cuti_penyesuaian
       WHERE tahun = ?`,
      [year]
    );

    for (const row of penyesuaianRows as PenyesuaianRow[]) {
      const employeeId = Number(row.karyawan_id);
      if (!employeeId) continue;

      const hari = Number(row.penyesuaian_hari);
      const terpakaiOverrideValue =
        row.terpakai_override === null || row.terpakai_override === undefined
          ? null
          : Number(row.terpakai_override);

      penyesuaianByEmployee.set(employeeId, {
        hari: Number.isFinite(hari) ? hari : 0,
        terpakaiOverride:
          terpakaiOverrideValue !== null && Number.isFinite(terpakaiOverrideValue) ? terpakaiOverrideValue : null,
        catatan: row.catatan,
      });
    }
  } catch (error) {
    console.error("Failed to fetch cuti penyesuaian:", error);
  }

  const rows: CutiRow[] = employees.map((employee) => {
    const penyesuaian = penyesuaianByEmployee.get(employee.id);

    return {
      id: employee.id,
      nama: employee.nama,
      jabatan: employee.jabatan,
      tanggalBergabung: formatDateDisplay(employee.tanggal_bergabung),
      jatahDasar: jatahCutiTahunan(employee.tanggal_bergabung, year),
      penyesuaianHari: penyesuaian?.hari ?? 0,
      catatan: penyesuaian?.catatan ?? null,
      usedComputed: usedByEmployee.get(employee.id) ?? 0,
      usedOverride: penyesuaian?.terpakaiOverride ?? null,
    };
  });

  return <CutiTahunanClient rows={rows} year={year} />;
}

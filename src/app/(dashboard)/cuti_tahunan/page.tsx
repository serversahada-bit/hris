import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";

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

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Cuti Tahunan</h1>
        </div>

        <form className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex gap-3 items-end">
          <div className="w-44">
            <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Tahun</label>
            <input
              type="number"
              name="year"
              defaultValue={year}
              min="2000"
              max="2100"
              className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition"
          >
            Tampilkan
          </button>
        </form>
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="font-extrabold text-slate-900 dark:text-white">Rekap Jatah Cuti {year}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              <tr className="h-12">
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Karyawan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Jabatan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Tgl Bergabung</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Jatah</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Terpakai</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Sisa</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Tidak ada karyawan.</td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const quota = jatahCutiTahunan(employee.tanggal_bergabung, year);
                  const used = usedByEmployee.get(employee.id) ?? 0;
                  const remaining = Math.max(0, quota - used);

                  return (
                    <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">{employee.nama || "-"}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">ID: {employee.id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{employee.jabatan || "-"}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{formatDateDisplay(employee.tanggal_bergabung)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40">
                          {quota}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-extrabold text-rose-700 dark:text-rose-400">{used}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-emerald-700 dark:text-emerald-400">{remaining}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
          <span>Jika cuti lintas tahun, hari akan di-clamp ke tahun terpilih.</span>
          <span className="hidden sm:inline">Gunakan filter Tahun untuk melihat rekap.</span>
        </div>
      </section>
    </div>
  );
}

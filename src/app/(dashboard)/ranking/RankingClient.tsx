"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDateToYmd, formatDisplayDate, getMonthName, type RankingRow } from "./ranking-utils";

interface RankingClientProps {
  ranking: RankingRow[];
  selectedDate: string;
}

function getRankStyle(index: number) {
  if (index === 1) {
    return { icon: "2", color: "text-slate-500" };
  }

  if (index === 2) {
    return { icon: "3", color: "text-orange-600" };
  }

  return { icon: `#${index + 1}`, color: "text-slate-500" };
}

function getStatusClass(status: string | null) {
  return status === "Terlambat"
    ? "bg-rose-50 text-rose-700 border-rose-100"
    : "bg-emerald-50 text-emerald-700 border-emerald-100";
}

export default function RankingClient({ ranking, selectedDate }: RankingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [filterType, setFilterType] = useState<"month" | "range">("month");
  const today = useMemo(() => new Date(), []);
  const [exportMonth, setExportMonth] = useState(String(today.getMonth() + 1));
  const [exportYear, setExportYear] = useState(String(today.getFullYear()));
  const [exportStartDate, setExportStartDate] = useState(formatDateToYmd(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [exportEndDate, setExportEndDate] = useState(formatDateToYmd(new Date(today.getFullYear(), today.getMonth() + 1, 0)));

  const champion = ranking[0] ?? null;
  const others = champion ? ranking.slice(1) : [];

  const handleDateSubmit = (formData: FormData) => {
    const nextDate = String(formData.get("tanggal") || selectedDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tanggal", nextDate);
    router.push(`${pathname}?${params.toString()}`);
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("export", "excel_custom");
    params.set("filter_type", filterType);

    if (filterType === "range") {
      params.set("start_date", exportStartDate);
      params.set("end_date", exportEndDate);
    } else {
      params.set("month", exportMonth);
      params.set("year", exportYear);
    }

    return `/api/ranking/export?${params.toString()}`;
  }, [exportEndDate, exportMonth, exportStartDate, exportYear, filterType]);

  return (
    <div className="w-full space-y-6 relative z-0 text-slate-800 dark:text-slate-200">
      <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Leaderboard Kedatangan</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Ranking absensi tanggal{" "}
              <b className="text-slate-900 dark:text-white">{formatDisplayDate(selectedDate)}</b>
            </p>
            <p className="mt-1 text-xs text-brand-700 dark:text-brand-300 font-bold bg-brand-50 dark:bg-brand-900/20 inline-block px-2 py-1 rounded-md border border-brand-100 dark:border-brand-800/40">
              *Menampilkan karyawan reguler (Absen &ge; 07:00 WIB)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-end">
            <form action={handleDateSubmit} className="flex-1 sm:flex-none w-full">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-[0.22em]">Pilih Tanggal</label>
              <div className="mt-2 flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  type="date"
                  name="tanggal"
                  defaultValue={selectedDate}
                  className="w-full sm:w-[180px] h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
                <button
                  type="submit"
                  className="h-11 px-5 rounded-2xl text-white font-extrabold text-sm bg-brand-600 hover:bg-brand-700 shadow-sm transition active:scale-[0.99] whitespace-nowrap"
                >
                  Tampilkan
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportOpen(true)}
                  className="h-11 px-4 inline-flex items-center gap-2 rounded-2xl text-brand-700 dark:text-brand-300 font-extrabold text-sm bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/40 shadow-sm hover:bg-brand-100 dark:hover:bg-brand-900/30 transition active:scale-[0.99] whitespace-nowrap"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Ekspor Rekap (XLS)
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {ranking.length > 0 && (
        <div className="flex justify-end">
          <div className="inline-flex items-center justify-between gap-3 px-5 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm w-full sm:w-auto">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Total Masuk (Reguler)</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-brand-600 text-white">
              {ranking.length} Orang
            </span>
          </div>
        </div>
      )}

      {ranking.length === 0 ? (
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-10 sm:p-14 text-center">
            <div className="mb-3 opacity-60">
              <span className="material-symbols-outlined text-[60px] text-slate-300 dark:text-slate-600">schedule</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Belum ada data masuk</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Belum ada absen reguler (di atas jam 07:00) pada tanggal ini.</p>
          </div>
        </section>
      ) : (
        <>
          {champion && (
            <section className="rounded-3xl overflow-hidden border border-white/60 shadow-[0_30px_80px_-55px_rgba(2,6,23,.45)]">
              <div className="relative p-6 sm:p-7 text-white bg-gradient-to-br from-yellow-400 to-orange-500">
                <div className="absolute -right-10 -top-10 text-8xl opacity-20 rotate-12 select-none font-black tracking-tight">TOP</div>
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition"></div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="relative shrink-0">
                    <img src={champion.foto_masuk || champion.foto_profil || `https://ui-avatars.com/api/?name=${encodeURIComponent(champion.nama || "User")}`} className="w-24 h-24 rounded-full border-4 border-white/30 shadow-md object-cover bg-white" alt={champion.nama || ""} />
                    <div className="absolute -bottom-2 -right-2 bg-white text-yellow-600 h-8 w-8 rounded-full flex items-center justify-center font-extrabold shadow-sm border-2 border-yellow-100">1</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-yellow-300 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Early Bird (Reguler)</span>
                    </div>
                    <h2 className="text-2xl font-extrabold leading-tight truncate">{champion.nama || "-"}</h2>
                    <div className="text-yellow-50 text-sm mb-4 truncate">{champion.jabatan || "Staff"}</div>

                    <div className="inline-flex items-center gap-3 bg-black/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className="text-center">
                        <div className="text-[10px] text-white/70 uppercase font-extrabold tracking-wider">Jam Masuk</div>
                        <div className="font-mono font-extrabold text-lg leading-none">
                          {champion.jam_masuk ? champion.jam_masuk.slice(0, 5) : "--:--"}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-[10px] text-white/70 uppercase font-extrabold tracking-wider">Status</div>
                        <div className="font-extrabold text-sm leading-none uppercase">
                          {champion.status || "Tepat Waktu"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-white/70 font-extrabold">Urutan</div>
                      <div className="text-xl font-extrabold">Paling Awal</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="font-extrabold text-slate-900 dark:text-white">Peringkat Selanjutnya</div>
            </div>
            <div className="p-5 sm:p-6 space-y-3">
              {others.map((row, index) => {
                const style = getRankStyle(index + 1);
                return (
                  <div key={`${row.nama}-${row.jam_masuk}-${index}`} className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <div className={`w-10 h-10 shrink-0 rounded-2xl bg-white/70 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 grid place-items-center text-sm font-extrabold ${style.color}`}>
                      {style.icon}
                    </div>
                    <img src={row.foto_masuk || row.foto_profil || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama || "User")}`} className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-600 bg-white shadow-sm" alt={row.nama || ""} />
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate">{row.nama || "-"}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">{row.jabatan || "-"}</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="font-mono font-extrabold text-slate-900 dark:text-white text-lg">{row.jam_masuk ? row.jam_masuk.slice(0, 5) : "--:--"}</div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getStatusClass(row.status)}`}>
                        {row.status || "Hadir"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {isExportOpen && (
        <div className="fixed inset-0 z-[2147481500]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsExportOpen(false)}></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-800 text-left shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-100 dark:border-slate-700">
                <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-extrabold leading-6 text-slate-900 dark:text-white">Export Rekap Leaderboard</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hanya menghitung karyawan reguler (&ge; 07:00).</p>
                  </div>
                  <button type="button" onClick={() => setIsExportOpen(false)} className="h-9 w-9 rounded-2xl bg-white/70 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-500 hover:bg-white dark:hover:bg-slate-600 hover:text-rose-600 flex items-center justify-center transition">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Metode Rekap</label>
                    <select
                      value={filterType}
                      onChange={(event) => setFilterType(event.target.value as "month" | "range")}
                      className="w-full h-12 px-4 rounded-2xl border border-brand-200 dark:border-brand-800/40 bg-white dark:bg-slate-900 text-sm outline-none focus:border-brand-500"
                    >
                      <option value="month">Per Bulan</option>
                      <option value="range">Rentang Tanggal (Kustom)</option>
                    </select>
                  </div>

                  {filterType === "month" ? (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">Bulan</label>
                          <select value={exportMonth} onChange={(event) => setExportMonth(event.target.value)} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                            {Array.from({ length: 12 }, (_, index) => {
                              const month = index + 1;
                              return (
                                <option key={month} value={String(month)}>
                                  {getMonthName(month)}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">Tahun</label>
                          <input type="number" value={exportYear} onChange={(event) => setExportYear(event.target.value)} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl space-y-4">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">Dari Tanggal</label>
                        <input type="date" value={exportStartDate} onChange={(event) => setExportStartDate(event.target.value)} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">Sampai Tanggal</label>
                        <input type="date" value={exportEndDate} onChange={(event) => setExportEndDate(event.target.value)} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/70 dark:bg-slate-800 px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsExportOpen(false)} className="h-11 px-5 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-extrabold text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition active:scale-[0.98]">
                    Batal
                  </button>
                  <a href={exportHref} onClick={() => setIsExportOpen(false)} className="h-11 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-extrabold text-sm shadow-sm hover:brightness-110 transition active:scale-[0.98] inline-flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download XLS
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCutiPenyesuaian } from "@/app/actions/cuti";
import { useAlert } from "@/components/AlertProvider";

export interface CutiRow {
  id: number;
  nama: string | null;
  jabatan: string | null;
  tanggalBergabung: string | null;
  jatahDasar: number;
  penyesuaianHari: number;
  catatan: string | null;
  usedComputed: number;
  usedOverride: number | null;
}

export default function CutiTahunanClient({ rows, year }: { rows: CutiRow[]; year: number }) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [isPending, startTransition] = useTransition();
  const [editRow, setEditRow] = useState<CutiRow | null>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  useEffect(() => {
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;

    const updateWidth = () => setTableScrollWidth(tableEl.scrollWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(tableEl);
    return () => observer.disconnect();
  }, [rows]);

  const syncScroll = (source: "top" | "table") => {
    if (isSyncingScroll.current) return;
    const topEl = topScrollRef.current;
    const tableEl = tableScrollRef.current;
    if (!topEl || !tableEl) return;

    isSyncingScroll.current = true;
    if (source === "top") {
      tableEl.scrollLeft = topEl.scrollLeft;
    } else {
      topEl.scrollLeft = tableEl.scrollLeft;
    }
    isSyncingScroll.current = false;
  };

  const handleEditSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateCutiPenyesuaian(formData);
      if (result.success) {
        setEditRow(null);
        router.refresh();
      }
      showAlert(result.message, result.success ? "success" : "error");
    });
  };

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

        <div
          ref={topScrollRef}
          onScroll={() => syncScroll("top")}
          className="overflow-x-auto overflow-y-hidden border-b border-slate-100 dark:border-slate-700"
        >
          <div style={{ width: tableScrollWidth, height: 1 }} />
        </div>

        <div ref={tableScrollRef} onScroll={() => syncScroll("table")} className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              <tr className="h-12">
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Karyawan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Jabatan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Tgl Bergabung</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Jatah</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Terpakai</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Sisa</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Catatan</th>
                <th className="sticky right-0 z-10 px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center bg-slate-50 dark:bg-slate-900 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Tidak ada karyawan.</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const quota = Math.max(0, row.jatahDasar + row.penyesuaianHari);
                  const used = row.usedOverride ?? row.usedComputed;
                  const remaining = Math.max(0, quota - used);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">{row.nama || "-"}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">ID: {row.id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{row.jabatan || "-"}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{row.tanggalBergabung || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40">
                          {quota}
                        </span>
                        {row.penyesuaianHari !== 0 && (
                          <div className="text-[11px] font-semibold mt-1 text-slate-400 dark:text-slate-500">
                            dasar {row.jatahDasar} {row.penyesuaianHari > 0 ? `+${row.penyesuaianHari}` : row.penyesuaianHari}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-extrabold text-rose-700 dark:text-rose-400">{used}</span>
                        {row.usedOverride !== null && (
                          <div className="text-[11px] font-semibold mt-1 text-slate-400 dark:text-slate-500">
                            otomatis {row.usedComputed}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-extrabold text-emerald-700 dark:text-emerald-400">{remaining}</td>
                      <td className="px-6 py-4 max-w-[160px]">
                        {row.catatan ? (
                          <span title={row.catatan} className="block truncate text-xs text-slate-600 dark:text-slate-300 font-semibold italic">
                            &ldquo;{row.catatan}&rdquo;
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="sticky right-0 z-10 px-6 py-4 text-center bg-white dark:bg-slate-800 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
                        <button
                          type="button"
                          onClick={() => setEditRow(row)}
                          className="h-9 px-4 rounded-2xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 shadow-sm transition"
                        >
                          Edit
                        </button>
                      </td>
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

      {editRow && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setEditRow(null)}></div>
          <div className="relative w-full max-w-lg rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-extrabold">Edit Cuti {year}</div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">{editRow.nama || `ID: ${editRow.id}`}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jatah dasar: {editRow.jatahDasar} hari</div>
              </div>
              <button onClick={() => setEditRow(null)} className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-500 hover:bg-white dark:hover:bg-slate-600 hover:text-rose-600 flex items-center justify-center transition">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form action={handleEditSubmit} className="p-6 space-y-4">
              <input type="hidden" name="karyawan_id" value={editRow.id} />
              <input type="hidden" name="tahun" value={year} />

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">
                  Penyesuaian Hari (+/-)
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="penyesuaian_hari"
                  defaultValue={editRow.penyesuaianHari}
                  className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
                <div className="text-[11px] text-slate-400 mt-1">Isi angka positif untuk menambah jatah, negatif untuk mengurangi. Isi 0 untuk mengembalikan ke jatah dasar.</div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">
                  Terpakai (override)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name="terpakai_override"
                  defaultValue={editRow.usedOverride ?? ""}
                  placeholder={`Otomatis: ${editRow.usedComputed}`}
                  className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Otomatis dihitung dari pengajuan cuti yang disetujui ({editRow.usedComputed} hari). Isi angka untuk koreksi manual, kosongkan untuk pakai nilai otomatis lagi.
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Catatan</label>
                <textarea
                  name="catatan"
                  rows={4}
                  defaultValue={editRow.catatan || ""}
                  placeholder="Contoh: tambahan cuti karena lembur libur nasional"
                  className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditRow(null)} className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Batal
                </button>
                <button type="submit" disabled={isPending} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-brand-600 hover:bg-brand-700 shadow-sm disabled:opacity-60">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  deletePengajuanIzin,
  finalApproveIzin,
  finalRejectIzin,
  forceApproveManagerIzin,
  updatePengajuanIzin,
} from "@/app/actions/izin";

type StatusFilter = "Menunggu Manager" | "Pending" | "Disetujui" | "Ditolak" | "Semua";

export interface IzinRow {
  id: number;
  karyawan_id: number;
  nama: string | null;
  foto: string | null;
  tipe_izin: string | null;
  mulai_tanggal: string | null;
  sampai_tanggal: string | null;
  alasan: string | null;
  status: string | null;
  created_at: string | null;
  bukti_foto: string | null;
  manager_status: string | null;
  manager_note: string | null;
  manager_at: string | null;
  catatan_admin: string | null;
  bukti_url: string;
}

function shortPeriode(mulai: string | null, sampai: string | null) {
  const start = mulai || "-";
  const end = sampai || "-";
  return start === end ? start : `${start} -> ${end}`;
}

function finalBadge(status: string | null) {
  if (status === "Disetujui") return "bg-emerald-50 text-emerald-800 border border-emerald-100";
  if (status === "Ditolak") return "bg-rose-50 text-rose-800 border border-rose-100";
  if (status === "Pending") return "bg-amber-50 text-amber-800 border border-amber-100";
  return "bg-white/70 text-slate-700 border border-slate-100";
}

function managerBadge(status: string | null) {
  if (status === "Disetujui") return "bg-emerald-50 text-emerald-800 border border-emerald-100";
  if (status === "Ditolak") return "bg-rose-50 text-rose-800 border border-rose-100";
  if (!status || status === "Pending") return "bg-amber-50 text-amber-800 border border-amber-100";
  return "bg-white/70 text-slate-700 border border-slate-100";
}

function canFinalAction(row: IzinRow) {
  return row.status === "Pending" && row.manager_status === "Disetujui";
}

function canEdit(row: IzinRow) {
  return row.status === "Pending";
}

function canForceManager(row: IzinRow) {
  return row.status === "Pending" && row.manager_status !== "Disetujui" && row.manager_status !== "Ditolak";
}

export default function IzinClient({
  rows,
  selectedStatus,
}: {
  rows: IzinRow[];
  selectedStatus: StatusFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [detailRow, setDetailRow] = useState<IzinRow | null>(null);
  const [editRow, setEditRow] = useState<IzinRow | null>(null);
  const [actionRow, setActionRow] = useState<IzinRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<IzinRow | null>(null);
  const [managerRow, setManagerRow] = useState<IzinRow | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [exportStartDate, setExportStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  });

  const filterOptions: StatusFilter[] = ["Menunggu Manager", "Pending", "Disetujui", "Ditolak", "Semua"];

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("start_date", exportStartDate);
    params.set("end_date", exportEndDate);
    return `/api/izin/export?${params.toString()}`;
  }, [exportEndDate, exportStartDate]);

  const switchStatus = (status: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  };

  const refreshAfterAction = () => {
    router.refresh();
  };

  const handleEditSubmit = async (formData: FormData) => {
    formData.set("status_filter", selectedStatus);
    const result = await updatePengajuanIzin(formData);
    if (result.success) {
      setEditRow(null);
      refreshAfterAction();
    }
    alert(result.message);
  };

  const handleApprove = (row: IzinRow) => {
    const formData = new FormData();
    formData.set("izin_id", String(row.id));
    formData.set("status_filter", selectedStatus);
    startTransition(async () => {
      const result = await finalApproveIzin(formData);
      if (result.success) {
        setActionRow(null);
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  const handleReject = () => {
    if (!actionRow) return;
    const formData = new FormData();
    formData.set("izin_id", String(actionRow.id));
    formData.set("status_filter", selectedStatus);
    formData.set("alasan_admin", rejectReason);
    startTransition(async () => {
      const result = await finalRejectIzin(formData);
      if (result.success) {
        setActionRow(null);
        setRejectReason("");
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  const handleDelete = (row: IzinRow) => {
    const formData = new FormData();
    formData.set("izin_id", String(row.id));
    formData.set("status_filter", selectedStatus);
    startTransition(async () => {
      const result = await deletePengajuanIzin(formData);
      if (result.success) {
        setDeleteRow(null);
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  const handleForceManager = (row: IzinRow) => {
    const formData = new FormData();
    formData.set("izin_id", String(row.id));
    formData.set("status_filter", selectedStatus);
    startTransition(async () => {
      const result = await forceApproveManagerIzin(formData);
      if (result.success) {
        setManagerRow(null);
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Manajemen Izin dan Cuti</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Tabel: <b className="text-slate-700 dark:text-slate-200">pengajuan_izin</b>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="h-10 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-extrabold text-xs hover:brightness-110 shadow-sm transition inline-flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export XLS
          </button>

          <div className="inline-flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-1 flex-wrap">
            {filterOptions.map((option) => {
              const active = selectedStatus === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => switchStatus(option)}
                  className={`h-10 px-4 rounded-2xl font-extrabold text-xs transition inline-flex items-center justify-center ${
                    active
                      ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-sm border border-white/40"
                      : "bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-800 dark:hover:text-brand-300 hover:bg-white dark:hover:bg-slate-700 border border-transparent"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
          <div className="font-extrabold text-slate-900 dark:text-white">Daftar Pengajuan</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Link bukti mengarah ke server lama jika file tersedia
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              <tr className="h-12">
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Karyawan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Tipe</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Periode</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Status Final</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">ACC Manager</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Diajukan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Tidak ada pengajuan.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{row.nama || `ID: ${row.karyawan_id}`}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">ID: {row.karyawan_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40">
                        {row.tipe_izin || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {shortPeriode(row.mulai_tanggal, row.sampai_tanggal)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${finalBadge(row.status)}`}>
                        {row.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${managerBadge(row.manager_status)}`}>
                        {row.manager_status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                      {row.created_at || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setDetailRow(row)}
                          className="h-9 px-4 rounded-2xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm"
                        >
                          Detail
                        </button>

                        {canEdit(row) && (
                          <button
                            type="button"
                            onClick={() => setEditRow(row)}
                            className="h-9 px-4 rounded-2xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 shadow-sm"
                          >
                            Edit
                          </button>
                        )}

                        {canFinalAction(row) && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectReason("");
                              setActionRow(row);
                            }}
                            className="h-9 px-4 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 shadow-sm"
                          >
                            Proses HC
                          </button>
                        )}

                        {canForceManager(row) && (
                          <button
                            type="button"
                            onClick={() => setManagerRow(row)}
                            className="h-9 px-4 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 shadow-sm"
                          >
                            ACC Manager
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteRow(row)}
                          className="h-9 px-4 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 shadow-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailRow && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setDetailRow(null)}></div>
          <div className="relative w-full max-w-2xl rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-extrabold">Detail Pengajuan</div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">{detailRow.nama || `ID: ${detailRow.karyawan_id}`}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Karyawan ID: {detailRow.karyawan_id} • Diajukan: {detailRow.created_at || "-"}
                </div>
              </div>
              <button onClick={() => setDetailRow(null)} className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-500 hover:bg-white dark:hover:bg-slate-600 hover:text-rose-600 flex items-center justify-center transition">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Tipe Izin</div>
                  <div className="text-slate-900 dark:text-white font-bold mt-2">{detailRow.tipe_izin || "-"}</div>
                </div>
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Periode</div>
                  <div className="text-slate-900 dark:text-white font-bold mt-2">{shortPeriode(detailRow.mulai_tanggal, detailRow.sampai_tanggal)}</div>
                </div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Alasan</div>
                <div className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{detailRow.alasan || "-"}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Status Manager</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${managerBadge(detailRow.manager_status)}`}>
                      {detailRow.manager_status || "Pending"}
                    </span>
                  </div>
                  {detailRow.manager_at && <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Waktu: {detailRow.manager_at}</div>}
                  {detailRow.manager_note && (
                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detailRow.manager_note}</div>
                  )}
                </div>

                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Status HC</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${finalBadge(detailRow.status)}`}>
                      {detailRow.status || "Pending"}
                    </span>
                  </div>
                  {detailRow.catatan_admin && (
                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detailRow.catatan_admin}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Bukti</div>
                {detailRow.bukti_url ? (
                  <a href={detailRow.bukti_url} target="_blank" className="h-10 px-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40 font-extrabold text-xs hover:bg-brand-100 dark:hover:bg-brand-900/30 transition">
                    Lihat Bukti
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold">Tidak ada bukti</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editRow && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setEditRow(null)}></div>
          <div className="relative w-full max-w-2xl rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-extrabold">Edit Pengajuan</div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">{editRow.nama || `ID: ${editRow.karyawan_id}`}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Status: {editRow.status || "Pending"}</div>
              </div>
              <button onClick={() => setEditRow(null)} className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-500 hover:bg-white dark:hover:bg-slate-600 hover:text-rose-600 flex items-center justify-center transition">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form action={handleEditSubmit} className="p-6 space-y-4">
              <input type="hidden" name="izin_id" value={editRow.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Tipe Izin</label>
                  <input name="tipe_izin" defaultValue={editRow.tipe_izin || ""} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Periode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" name="mulai_tanggal" defaultValue={editRow.mulai_tanggal || ""} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" required />
                    <input type="date" name="sampai_tanggal" defaultValue={editRow.sampai_tanggal || ""} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" required />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Alasan</label>
                <textarea name="alasan" rows={4} defaultValue={editRow.alasan || ""} className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm outline-none" required></textarea>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Edit file bukti baru belum saya aktifkan di migrasi ini. Bukti lama tetap bisa dibuka dari detail jika tersedia.
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

      {actionRow && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setActionRow(null)}></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white text-center">Proses Final HC</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm text-center mt-2">
                {actionRow.nama || `ID: ${actionRow.karyawan_id}`} • {actionRow.tipe_izin || "-"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Alasan penolakan wajib jika Reject</label>
                <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={3} className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm outline-none" placeholder="Tulis alasan penolakan"></textarea>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setActionRow(null)} className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Batal
                </button>
                <button type="button" disabled={isPending} onClick={() => handleReject()} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60">
                  Reject
                </button>
                <button type="button" disabled={isPending} onClick={() => handleApprove(actionRow)} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteRow && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setDeleteRow(null)}></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="text-[11px] uppercase tracking-[0.22em] text-rose-600 font-extrabold">Konfirmasi Hapus</div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white truncate mt-1">Hapus Pengajuan #{deleteRow.id}</h3>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deleteRow.nama || `ID: ${deleteRow.karyawan_id}`} • {deleteRow.tipe_izin || "-"}</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-3xl bg-rose-50/70 border border-rose-200/70 p-4 text-sm text-rose-900">
                Aksi ini <b>tidak bisa dibatalkan</b>. Data izin akan dihapus permanen.
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeleteRow(null)} className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Batal
                </button>
                <button type="button" disabled={isPending} onClick={() => handleDelete(deleteRow)} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60">
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {managerRow && (
        <div className="fixed inset-0 z-[82] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setManagerRow(null)}></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white text-center">ACC Manager oleh HC</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm text-center mt-2">
                {managerRow.nama || `ID: ${managerRow.karyawan_id}`} • {managerRow.tipe_izin || "-"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-3xl bg-indigo-50/80 border border-indigo-200/80 p-4 text-xs text-indigo-900">
                Tindakan ini akan mengubah status <b>Manager</b> menjadi <b>Disetujui</b>, seolah-olah Manager sudah meng-ACC pengajuan ini.
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setManagerRow(null)} className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Batal
                </button>
                <button type="button" disabled={isPending} onClick={() => handleForceManager(managerRow)} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60">
                  Ya, ACC sebagai Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExportOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setIsExportOpen(false)}></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Export Rekap Izin & Cuti</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pilih rentang tanggal pengajuan yang ingin diekspor.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">Dari Tanggal</label>
                <input type="date" value={exportStartDate} onChange={(event) => setExportStartDate(event.target.value)} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">Sampai Tanggal</label>
                <input type="date" value={exportEndDate} onChange={(event) => setExportEndDate(event.target.value)} className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsExportOpen(false)} className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Batal
                </button>
                <a href={exportHref} onClick={() => setIsExportOpen(false)} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 shadow-sm transition inline-flex items-center justify-center">
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

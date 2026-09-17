"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { approveLegalitas, deletePengajuanLegalitas, rejectLegalitas, selesaikanLegalitas } from "@/app/actions/legalitas";

type StatusFilter = "Pending" | "Diproses" | "Selesai" | "Ditolak" | "Semua";

export interface LegalitasRow {
  id: number;
  karyawan_id: number;
  nama: string | null;
  jenis_dokumen: string | null;
  keterangan: string | null;
  status: string | null;
  catatan_admin: string | null;
  estimasi_hari: number | null;
  created_at: string | null;
  diproses_at: string | null;
  selesai_at: string | null;
  manager_at: string | null;
  file_url: string;
  file_hasil_url: string;
}

function statusBadge(status: string | null) {
  if (status === "Selesai") return "bg-emerald-50 text-emerald-800 border border-emerald-100";
  if (status === "Diproses") return "bg-sky-50 text-sky-800 border border-sky-100";
  if (status === "Ditolak") return "bg-rose-50 text-rose-800 border border-rose-100";
  return "bg-amber-50 text-amber-800 border border-amber-100";
}

function canProses(row: LegalitasRow) {
  return (row.status || "Pending") === "Pending";
}

function canSelesaikan(row: LegalitasRow) {
  return row.status === "Diproses";
}

export default function LegalitasClient({
  rows,
  selectedStatus,
}: {
  rows: LegalitasRow[];
  selectedStatus: StatusFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [detailRow, setDetailRow] = useState<LegalitasRow | null>(null);
  const [actionRow, setActionRow] = useState<LegalitasRow | null>(null);
  const [selesaikanRow, setSelesaikanRow] = useState<LegalitasRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<LegalitasRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [estimasiHari, setEstimasiHari] = useState("");
  const [fileHasil, setFileHasil] = useState<File | null>(null);

  const filterOptions: StatusFilter[] = ["Pending", "Diproses", "Selesai", "Ditolak", "Semua"];

  const switchStatus = (status: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  };

  const refreshAfterAction = () => {
    router.refresh();
  };

  const handleApprove = () => {
    if (!actionRow) return;
    if (!estimasiHari || Number(estimasiHari) <= 0) {
      alert("Estimasi hari proses wajib diisi.");
      return;
    }
    const formData = new FormData();
    formData.set("legalitas_id", String(actionRow.id));
    formData.set("status_filter", selectedStatus);
    formData.set("estimasi_hari", estimasiHari);
    startTransition(async () => {
      const result = await approveLegalitas(formData);
      if (result.success) {
        setActionRow(null);
        setEstimasiHari("");
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  const handleReject = () => {
    if (!actionRow) return;
    const formData = new FormData();
    formData.set("legalitas_id", String(actionRow.id));
    formData.set("status_filter", selectedStatus);
    formData.set("catatan_admin", rejectReason);
    startTransition(async () => {
      const result = await rejectLegalitas(formData);
      if (result.success) {
        setActionRow(null);
        setRejectReason("");
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  const handleSelesaikan = () => {
    if (!selesaikanRow) return;
    if (!fileHasil) {
      alert("Dokumen hasil wajib diunggah.");
      return;
    }
    const formData = new FormData();
    formData.set("legalitas_id", String(selesaikanRow.id));
    formData.set("status_filter", selectedStatus);
    formData.set("file_hasil", fileHasil);
    startTransition(async () => {
      const result = await selesaikanLegalitas(formData);
      if (result.success) {
        setSelesaikanRow(null);
        setFileHasil(null);
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  const handleDelete = (row: LegalitasRow) => {
    const formData = new FormData();
    formData.set("legalitas_id", String(row.id));
    formData.set("status_filter", selectedStatus);
    startTransition(async () => {
      const result = await deletePengajuanLegalitas(formData);
      if (result.success) {
        setDeleteRow(null);
        refreshAfterAction();
      }
      alert(result.message);
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Approval Legalitas</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Tabel: <b className="text-slate-700 dark:text-slate-200">pengajuan_legalitas</b>
          </div>
        </div>

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

      <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
          <div className="font-extrabold text-slate-900 dark:text-white">Daftar Pengajuan</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            File PDF mengarah ke server lama jika tersedia
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              <tr className="h-12">
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Karyawan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Jenis Dokumen</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Status</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Diajukan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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
                        {row.jenis_dokumen || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${statusBadge(row.status)}`}>
                        {row.status || "Pending"}
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

                        {canProses(row) && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectReason("");
                              setEstimasiHari("");
                              setActionRow(row);
                            }}
                            className="h-9 px-4 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 shadow-sm"
                          >
                            Proses
                          </button>
                        )}

                        {canSelesaikan(row) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFileHasil(null);
                              setSelesaikanRow(row);
                            }}
                            className="h-9 px-4 rounded-2xl bg-sky-600 text-white text-xs font-extrabold hover:bg-sky-700 shadow-sm"
                          >
                            Selesaikan
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Jenis Dokumen</div>
                  <div className="text-slate-900 dark:text-white font-bold mt-2">{detailRow.jenis_dokumen || "-"}</div>
                </div>
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Status</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${statusBadge(detailRow.status)}`}>
                      {detailRow.status || "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {detailRow.keterangan && (
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Keterangan</div>
                  <div className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{detailRow.keterangan}</div>
                </div>
              )}

              {detailRow.status === "Ditolak" && detailRow.catatan_admin && (
                <div className="rounded-3xl bg-rose-50/70 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/40 p-4">
                  <div className="text-xs text-rose-600 font-extrabold uppercase tracking-[0.22em]">Alasan Penolakan</div>
                  <div className="text-rose-800 dark:text-rose-300 mt-2 whitespace-pre-wrap">{detailRow.catatan_admin}</div>
                  {detailRow.manager_at && <div className="text-xs text-rose-500 mt-2">Waktu: {detailRow.manager_at}</div>}
                </div>
              )}

              {(detailRow.status === "Diproses" || detailRow.status === "Selesai") && (
                <div className="rounded-3xl bg-sky-50/70 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/40 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-sky-600 font-extrabold uppercase tracking-[0.22em]">Estimasi Proses</div>
                    <div className="text-sky-900 dark:text-sky-300 font-bold mt-1">{detailRow.estimasi_hari ? `${detailRow.estimasi_hari} hari` : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-sky-600 font-extrabold uppercase tracking-[0.22em]">Mulai Diproses</div>
                    <div className="text-sky-900 dark:text-sky-300 font-bold mt-1">{detailRow.diproses_at || "-"}</div>
                  </div>
                  {detailRow.status === "Selesai" && (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-sky-600 font-extrabold uppercase tracking-[0.22em]">Selesai Pada</div>
                      <div className="text-sky-900 dark:text-sky-300 font-bold mt-1">{detailRow.selesai_at || "-"}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">File Pengajuan</div>
                {detailRow.file_url ? (
                  <a href={detailRow.file_url} target="_blank" className="h-10 px-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40 font-extrabold text-xs hover:bg-brand-100 dark:hover:bg-brand-900/30 transition">
                    Lihat PDF
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold">Tidak ada file</span>
                )}
              </div>

              {detailRow.status === "Selesai" && (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Dokumen Hasil</div>
                  {detailRow.file_hasil_url ? (
                    <a href={detailRow.file_hasil_url} target="_blank" className="h-10 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40 font-extrabold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition">
                      Unduh Dokumen
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">Tidak ada file</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {actionRow && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setActionRow(null)}></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white text-center">Proses Pengajuan</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm text-center mt-2">
                {actionRow.nama || `ID: ${actionRow.karyawan_id}`} • {actionRow.jenis_dokumen || "-"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Estimasi hari proses (wajib jika Approve)</label>
                <input
                  type="number"
                  min={1}
                  value={estimasiHari}
                  onChange={(event) => setEstimasiHari(event.target.value)}
                  className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                  placeholder="Contoh: 7"
                />
              </div>
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
                <button type="button" disabled={isPending} onClick={() => handleApprove()} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selesaikanRow && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setSelesaikanRow(null)}></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white text-center">Selesaikan Pengajuan</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm text-center mt-2">
                {selesaikanRow.nama || `ID: ${selesaikanRow.karyawan_id}`} • {selesaikanRow.jenis_dokumen || "-"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Dokumen hasil (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setFileHasil(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:h-10 file:px-4 file:rounded-2xl file:border-0 file:bg-brand-50 dark:file:bg-brand-900/20 file:text-brand-700 dark:file:text-brand-300 file:font-extrabold file:text-xs"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelesaikanRow(null)} className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Batal
                </button>
                <button type="button" disabled={isPending} onClick={() => handleSelesaikan()} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60">
                  Selesaikan
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
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deleteRow.nama || `ID: ${deleteRow.karyawan_id}`} • {deleteRow.jenis_dokumen || "-"}</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-3xl bg-rose-50/70 border border-rose-200/70 p-4 text-sm text-rose-900">
                Aksi ini <b>tidak bisa dibatalkan</b>. Data legalitas akan dihapus permanen.
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
    </div>
  );
}

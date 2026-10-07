"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  approvePengajuanPeraturan,
  deletePengajuanPeraturan,
  rejectPengajuanPeraturan,
} from "@/app/actions/pengajuanPeraturan";
import { useAlert } from "@/components/AlertProvider";

type StatusFilter = "Pending" | "Disetujui" | "Ditolak" | "Semua";

export interface PengajuanRow {
  id: number;
  karyawan_id: number;
  nama: string | null;
  divisi: string | null;
  judul: string;
  file: string;
  url: string;
  catatan: string | null;
  status: string;
  catatan_admin: string | null;
  created_at: string;
  processed_at: string | null;
}

function statusBadge(status: string | null) {
  if (status === "Disetujui") return "bg-emerald-50 text-emerald-800 border border-emerald-100";
  if (status === "Ditolak") return "bg-rose-50 text-rose-800 border border-rose-100";
  return "bg-amber-50 text-amber-800 border border-amber-100";
}

function pengajuLabel(row: PengajuanRow) {
  const nama = row.nama || `ID: ${row.karyawan_id}`;
  return row.divisi ? `${nama} - ${row.divisi}` : nama;
}

// PDF pengajuan yang ditolak sudah dihapus dari storage, jadi tidak bisa di-preview.
function hasFile(row: PengajuanRow) {
  return row.status !== "Ditolak" && row.file !== "";
}

export default function PengajuanPeraturanClient({
  rows,
  selectedStatus,
}: {
  rows: PengajuanRow[];
  selectedStatus: StatusFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isPending, startTransition] = useTransition();
  const [detailRow, setDetailRow] = useState<PengajuanRow | null>(null);
  const [actionRow, setActionRow] = useState<PengajuanRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<PengajuanRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filterOptions: StatusFilter[] = ["Pending", "Disetujui", "Ditolak", "Semua"];

  const switchStatus = (status: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "pengajuan");
    params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApprove = (row: PengajuanRow) => {
    const formData = new FormData();
    formData.set("pengajuan_id", String(row.id));
    startTransition(async () => {
      const result = await approvePengajuanPeraturan(formData);
      if (result.success) {
        setActionRow(null);
        router.refresh();
      }
      showAlert(result.message, result.success ? "success" : "error");
    });
  };

  const handleReject = () => {
    if (!actionRow) return;
    const formData = new FormData();
    formData.set("pengajuan_id", String(actionRow.id));
    formData.set("alasan_admin", rejectReason);
    startTransition(async () => {
      const result = await rejectPengajuanPeraturan(formData);
      if (result.success) {
        setActionRow(null);
        setRejectReason("");
        router.refresh();
      }
      showAlert(result.message, result.success ? "success" : "error");
    });
  };

  const handleDelete = (row: PengajuanRow) => {
    const formData = new FormData();
    formData.set("pengajuan_id", String(row.id));
    startTransition(async () => {
      const result = await deletePengajuanPeraturan(formData);
      if (result.success) {
        setDeleteRow(null);
        router.refresh();
      }
      showAlert(result.message, result.success ? "success" : "error");
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pengajuan Dokumen Karyawan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Dokumen yang disetujui otomatis masuk ke daftar Peraturan Perusahaan.
          </p>
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
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="font-extrabold text-slate-900 dark:text-white">Daftar Pengajuan</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              <tr className="h-12">
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Pengaju</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Judul Dokumen</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Diajukan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Status</th>
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
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{row.divisi || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold max-w-[280px] truncate">
                      {row.judul}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{row.created_at}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
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

                        {row.status === "Pending" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectReason("");
                              setActionRow(row);
                            }}
                            className="h-9 px-4 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 shadow-sm"
                          >
                            Proses
                          </button>
                        )}

                        {row.status !== "Disetujui" && (
                          <button
                            type="button"
                            onClick={() => setDeleteRow(row)}
                            className="h-9 px-4 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 shadow-sm"
                          >
                            Hapus
                          </button>
                        )}
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
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="bg-white/70 dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-extrabold">Detail Pengajuan</div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">{detailRow.judul}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {pengajuLabel(detailRow)} • Diajukan: {detailRow.created_at}
                </div>
              </div>
              <button onClick={() => setDetailRow(null)} className="h-10 w-10 shrink-0 rounded-2xl bg-white/70 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-500 hover:bg-white dark:hover:bg-slate-600 hover:text-rose-600 flex items-center justify-center transition">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {hasFile(detailRow) && (
                <div className="rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-white">
                  <iframe src={detailRow.url} className="w-full h-[420px]" title="Preview PDF" />
                </div>
              )}

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Catatan Pengaju</div>
                <div className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{detailRow.catatan || "-"}</div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Status</div>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${statusBadge(detailRow.status)}`}>
                    {detailRow.status}
                  </span>
                  {detailRow.processed_at && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Diproses: {detailRow.processed_at}</span>
                  )}
                </div>
                {detailRow.catatan_admin && (
                  <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detailRow.catatan_admin}</div>
                )}
              </div>

              {hasFile(detailRow) && (
                <div className="flex gap-3">
                  <a
                    href={detailRow.url}
                    target="_blank"
                    rel="noopener"
                    className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition grid place-items-center"
                  >
                    Buka di Tab Baru
                  </a>
                  <a
                    href={detailRow.url}
                    download
                    className="h-11 flex-1 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-extrabold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition grid place-items-center"
                  >
                    Download
                  </a>
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
                {pengajuLabel(actionRow)} • {actionRow.judul}
              </p>
              <div className="text-center mt-3">
                <a
                  href={actionRow.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-700 dark:text-brand-300 hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  Cek PDF dulu
                </a>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-3xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-800/40 p-4 text-xs text-emerald-900 dark:text-emerald-200">
                Jika di-Approve, dokumen langsung tampil permanen di Peraturan Perusahaan untuk semua karyawan.
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Alasan penolakan wajib jika Reject</label>
                <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={3} maxLength={255} className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm outline-none" placeholder="Tulis alasan penolakan"></textarea>
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
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pengajuLabel(deleteRow)} • {deleteRow.judul}</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-3xl bg-rose-50/70 border border-rose-200/70 p-4 text-sm text-rose-900">
                Aksi ini <b>tidak bisa dibatalkan</b>. Data dan file PDF pengajuan akan dihapus permanen.
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

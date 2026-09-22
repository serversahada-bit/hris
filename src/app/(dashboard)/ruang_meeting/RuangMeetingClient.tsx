"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  approveRuangMeeting,
  deletePengajuanRuangMeeting,
  rejectRuangMeeting,
} from "@/app/actions/ruangMeeting";
import { useAlert } from "@/components/AlertProvider";

type StatusFilter = "Pending" | "Disetujui" | "Ditolak" | "Semua";

export interface RuangMeetingRow {
  id: number;
  karyawan_id: number;
  nama: string | null;
  tanggal: string | null;
  kegiatan: string | null;
  jenis_aktifitas: string | null;
  jam_mulai: string | null;
  jam_selesai: string | null;
  catatan: string | null;
  status: string | null;
  catatan_admin: string | null;
  created_at: string | null;
}

function shortJam(mulai: string | null, selesai: string | null) {
  const start = (mulai || "-").slice(0, 5);
  const end = (selesai || "-").slice(0, 5);
  return `${start} - ${end}`;
}

function statusBadge(status: string | null) {
  if (status === "Disetujui") return "bg-emerald-50 text-emerald-800 border border-emerald-100";
  if (status === "Ditolak") return "bg-rose-50 text-rose-800 border border-rose-100";
  return "bg-amber-50 text-amber-800 border border-amber-100";
}

function canProcess(row: RuangMeetingRow) {
  return row.status === "Pending";
}

export default function RuangMeetingClient({
  rows,
  selectedStatus,
}: {
  rows: RuangMeetingRow[];
  selectedStatus: StatusFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isPending, startTransition] = useTransition();
  const [detailRow, setDetailRow] = useState<RuangMeetingRow | null>(null);
  const [actionRow, setActionRow] = useState<RuangMeetingRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<RuangMeetingRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filterOptions: StatusFilter[] = ["Pending", "Disetujui", "Ditolak", "Semua"];

  const switchStatus = (status: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  };

  const refreshAfterAction = () => {
    router.refresh();
  };

  const handleApprove = (row: RuangMeetingRow) => {
    const formData = new FormData();
    formData.set("ruang_meeting_id", String(row.id));
    formData.set("status_filter", selectedStatus);
    startTransition(async () => {
      const result = await approveRuangMeeting(formData);
      if (result.success) {
        setActionRow(null);
        refreshAfterAction();
      }
      showAlert(result.message, result.success ? "success" : "error");
    });
  };

  const handleReject = () => {
    if (!actionRow) return;
    const formData = new FormData();
    formData.set("ruang_meeting_id", String(actionRow.id));
    formData.set("status_filter", selectedStatus);
    formData.set("alasan_admin", rejectReason);
    startTransition(async () => {
      const result = await rejectRuangMeeting(formData);
      if (result.success) {
        setActionRow(null);
        setRejectReason("");
        refreshAfterAction();
      }
      showAlert(result.message, result.success ? "success" : "error");
    });
  };

  const handleDelete = (row: RuangMeetingRow) => {
    const formData = new FormData();
    formData.set("ruang_meeting_id", String(row.id));
    formData.set("status_filter", selectedStatus);
    startTransition(async () => {
      const result = await deletePengajuanRuangMeeting(formData);
      if (result.success) {
        setDeleteRow(null);
        refreshAfterAction();
      }
      showAlert(result.message, result.success ? "success" : "error");
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pengajuan Ruang Meeting</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Tabel: <b className="text-slate-700 dark:text-slate-200">pengajuan_ruang_meeting</b>
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
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="font-extrabold text-slate-900 dark:text-white">Daftar Pengajuan</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              <tr className="h-12">
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Karyawan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Kegiatan</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Jenis Aktifitas</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Tanggal</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Waktu</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Status</th>
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
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold max-w-[220px] truncate">
                      {row.kegiatan || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40">
                        {row.jenis_aktifitas || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {row.tanggal || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {shortJam(row.jam_mulai, row.jam_selesai)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${statusBadge(row.status)}`}>
                        {row.status || "Pending"}
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

                        {canProcess(row) && (
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Jenis Aktifitas</div>
                  <div className="text-slate-900 dark:text-white font-bold mt-2">{detailRow.jenis_aktifitas || "-"}</div>
                </div>
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Jadwal</div>
                  <div className="text-slate-900 dark:text-white font-bold mt-2">{detailRow.tanggal || "-"} • {shortJam(detailRow.jam_mulai, detailRow.jam_selesai)}</div>
                </div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Kegiatan</div>
                <div className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{detailRow.kegiatan || "-"}</div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Catatan</div>
                <div className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{detailRow.catatan || "-"}</div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Status</div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${statusBadge(detailRow.status)}`}>
                    {detailRow.status || "Pending"}
                  </span>
                </div>
                {detailRow.catatan_admin && (
                  <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detailRow.catatan_admin}</div>
                )}
              </div>
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
                {actionRow.nama || `ID: ${actionRow.karyawan_id}`} • {actionRow.kegiatan || "-"}
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
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deleteRow.nama || `ID: ${deleteRow.karyawan_id}`} • {deleteRow.kegiatan || "-"}</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-3xl bg-rose-50/70 border border-rose-200/70 p-4 text-sm text-rose-900">
                Aksi ini <b>tidak bisa dibatalkan</b>. Data akan dihapus permanen.
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

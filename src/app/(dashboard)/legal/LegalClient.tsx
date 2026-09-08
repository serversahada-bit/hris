"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadLegal, deleteLegal } from "@/app/actions/legal";
import type { LegalDoc } from "./page";

const KATEGORI_OPTIONS = ["Kontrak", "Izin Usaha", "Perjanjian", "Sertifikat", "Lainnya"];
const SOON_DAYS = 30;

type Status = "tanpa_kadaluarsa" | "aktif" | "akan_habis" | "kadaluarsa";

function getStatus(tanggalKadaluarsa: string | null): Status {
  if (!tanggalKadaluarsa) return "tanpa_kadaluarsa";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(tanggalKadaluarsa);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "kadaluarsa";
  if (diffDays <= SOON_DAYS) return "akan_habis";
  return "aktif";
}

const STATUS_LABEL: Record<Status, string> = {
  tanpa_kadaluarsa: "Tanpa Kadaluarsa",
  aktif: "Aktif",
  akan_habis: "Akan Habis",
  kadaluarsa: "Kadaluarsa",
};

const STATUS_BADGE: Record<Status, string> = {
  tanpa_kadaluarsa: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
  aktif: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40",
  akan_habis: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40",
  kadaluarsa: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40",
};

function fmtSize(bytes: number | null) {
  if (bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDateShort(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function LegalClient({
  docs,
  q,
  viewUrl,
  viewTitle,
  viewFile,
}: {
  docs: LegalDoc[];
  q: string;
  viewUrl: string;
  viewTitle: string;
  viewFile: string;
}) {
  const router = useRouter();

  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await uploadLegal(formData);

    if (result?.error) {
      setUploadMsg({ type: "error", text: result.error });
    } else {
      setUploadMsg({ type: "success", text: "Berhasil upload dokumen legal." });
      e.currentTarget.reset();
      router.refresh();
    }
    setUploadLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus dokumen ini?")) return;

    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", String(id));
    const result = await deleteLegal(formData);

    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Legal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Dokumen legal perusahaan beserta status masa berlakunya.</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.22em]">Total</div>
          <div className="h-8 px-3 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 text-white font-extrabold grid place-items-center">
            {docs.length}
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <form
        method="GET"
        className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end"
      >
        <div className="flex-1 min-w-0 w-full">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Cari Dokumen</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="judul atau nama file"
            className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-6 rounded-2xl font-extrabold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 transition"
        >
          Cari
        </button>
      </form>

      {/* UPLOAD */}
      <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="font-extrabold text-slate-900 dark:text-white">Upload Dokumen Legal</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Format PDF • Maks 20MB</div>
        </div>

        <div className="p-6">
          {uploadMsg && (
            <div
              className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
                uploadMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40"
              }`}
            >
              {uploadMsg.text}
            </div>
          )}

          <form onSubmit={handleUpload} className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Judul</label>
                <input
                  name="judul"
                  placeholder="Contoh: Perjanjian Sewa Gedung"
                  className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Kategori</label>
                <select
                  name="kategori"
                  defaultValue={KATEGORI_OPTIONS[0]}
                  className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                >
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Tanggal Berlaku</label>
                <input
                  type="date"
                  name="tanggal_berlaku"
                  className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Tanggal Kadaluarsa</label>
                <input
                  type="date"
                  name="tanggal_kadaluarsa"
                  className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Catatan</label>
              <textarea
                name="catatan"
                rows={2}
                placeholder="Opsional"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">File PDF</label>
              <input
                type="file"
                name="file"
                accept="application/pdf,.pdf"
                required
                className="mt-2 w-full text-sm text-slate-600 dark:text-slate-300
                           file:mr-3 file:rounded-2xl file:border-0
                           file:bg-gradient-to-r file:from-brand-700 file:to-brand-500
                           file:px-5 file:py-3 file:text-white file:font-extrabold
                           hover:file:opacity-95"
              />
            </div>

            <button
              type="submit"
              disabled={uploadLoading}
              className="h-12 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 disabled:opacity-60 transition"
            >
              {uploadLoading ? "Mengunggah..." : "Upload"}
            </button>
          </form>
        </div>
      </section>

      {/* PREVIEW */}
      {viewUrl && (
        <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 dark:text-white truncate">{viewTitle || viewFile}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Preview PDF</div>
            </div>
            <a href="/legal" className="text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
              Tutup
            </a>
          </div>
          <div className="p-6">
            <div className="rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-white">
              <iframe src={viewUrl} className="w-full h-[560px]" title="Preview PDF" />
            </div>
          </div>
        </section>
      )}

      {/* LIST */}
      <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="font-extrabold text-slate-900 dark:text-white">Daftar Dokumen</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Klik Lihat untuk preview</div>
        </div>

        <div className="p-6 space-y-3">
          {docs.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-300 dark:text-slate-600">gavel</span>
              <div className="font-extrabold text-slate-800 dark:text-slate-200">Belum ada dokumen legal</div>
            </div>
          ) : (
            docs.map((d) => {
              const status = getStatus(d.tanggal_kadaluarsa);
              return (
                <div
                  key={d.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/70 transition"
                >
                  <div className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid place-items-center text-brand-600 dark:text-brand-400 shrink-0">
                    <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate">{d.judul}</div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40">
                        {d.kategori}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${STATUS_BADGE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {d.file} • {d.date} • {fmtSize(d.size)}
                    </div>
                    {(d.tanggal_berlaku || d.tanggal_kadaluarsa) && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Berlaku: {formatDateShort(d.tanggal_berlaku)} → {formatDateShort(d.tanggal_kadaluarsa)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <a
                      className="h-10 px-4 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 text-white text-xs font-extrabold hover:opacity-95 transition shadow-sm"
                      href={`/legal?view=${encodeURIComponent(d.file)}`}
                    >
                      Lihat
                    </a>
                    <a
                      className="h-10 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      target="_blank"
                      rel="noopener"
                      href={d.url}
                    >
                      Buka
                    </a>
                    <a
                      className="h-10 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      href={d.url}
                      download
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      disabled={deletingId === d.id}
                      onClick={() => handleDelete(d.id)}
                      className="h-10 px-4 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 disabled:opacity-60 transition"
                    >
                      {deletingId === d.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPeraturan, deletePeraturan, getStatusBacaPeraturan, type StatusBacaPeraturanKaryawan } from "@/app/actions/peraturan";
import { useAlert } from "@/components/AlertProvider";
import type { DocItem } from "./page";

type StatusBacaState = {
  doc: DocItem;
  loading: boolean;
  error: string;
  tab: "belum" | "sudah";
  sudah: StatusBacaPeraturanKaryawan[];
  belum: StatusBacaPeraturanKaryawan[];
};

function fmtSize(bytes: number | null) {
  if (bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function PeraturanClient({
  docs,
  q,
  viewUrl,
  viewTitle,
  viewFile,
}: {
  docs: DocItem[];
  q: string;
  viewUrl: string;
  viewTitle: string;
  viewFile: string;
}) {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusBaca, setStatusBaca] = useState<StatusBacaState | null>(null);

  const openStatusBaca = async (doc: DocItem) => {
    setStatusBaca({ doc, loading: true, error: "", tab: "belum", sudah: [], belum: [] });
    const result = await getStatusBacaPeraturan(doc.id);
    setStatusBaca((prev) => {
      if (!prev || prev.doc.id !== doc.id) return prev;
      if ("error" in result) return { ...prev, loading: false, error: result.error ?? "Gagal memuat status baca." };
      return { ...prev, loading: false, sudah: result.sudah, belum: result.belum };
    });
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await uploadPeraturan(formData);

    if (result?.error) {
      setUploadMsg({ type: "error", text: result.error });
    } else {
      setUploadMsg({
        type: "success",
        text: `Berhasil upload PDF. Dokumen terbit ke karyawan ${"terbitLabel" in result ? result.terbitLabel : ""} WIB.`,
      });
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
    const result = await deletePeraturan(formData);

    if (result?.error) {
      showAlert(result.error, "error");
    } else {
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Aturan Perusahaan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">HC: Upload dan kelola dokumen PDF peraturan perusahaan</p>
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
          <div className="font-extrabold text-slate-900 dark:text-white">Upload PDF</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Folder: <span className="font-mono">public/uploads/peraturan/</span> • Maks 20MB
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dokumen terbit ke karyawan jam 15:00 WIB (upload setelah jam 15:00 terbit besok) dan wajib dibaca di Great sebelum absen.
          </div>
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
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Judul</label>
              <input
                name="judul"
                placeholder="Contoh: Peraturan Kerja 2026"
                className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">File PDF</label>
              <input
                type="file"
                name="pdf"
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
            <a href="/peraturan_perusahaan" className="text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
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
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-300 dark:text-slate-600">folder_off</span>
              <div className="font-extrabold text-slate-800 dark:text-slate-200">Belum ada dokumen</div>
            </div>
          ) : (
            docs.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/70 transition"
              >
                <div className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 grid place-items-center text-brand-600 dark:text-brand-400">
                  <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-900 dark:text-white truncate">{d.judul}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {d.file} • {d.date} • {fmtSize(d.size)}
                  </div>
                  {d.pengaju && (
                    <div className="text-xs text-brand-700 dark:text-brand-300 font-semibold mt-1 truncate">
                      Diajukan oleh: {d.pengaju}
                    </div>
                  )}
                  {d.terjadwal ? (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Terjadwal terbit {d.terbitLabel} WIB
                    </div>
                  ) : (
                    d.baca && (
                      <button
                        type="button"
                        onClick={() => openStatusBaca(d)}
                        title="Lihat daftar yang sudah & belum membaca"
                        className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        Terbit {d.terbitLabel} • Sudah baca {d.baca.sudah}/{d.baca.wajib}
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <a
                    className="h-10 px-4 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 text-white text-xs font-extrabold hover:opacity-95 transition shadow-sm"
                    href={`/peraturan_perusahaan?view=${encodeURIComponent(d.file)}`}
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
            ))
          )}
        </div>
      </section>

      {statusBaca && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setStatusBaca(null)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Status Baca</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{statusBaca.doc.judul}</div>
              </div>
              <button onClick={() => setStatusBaca(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900">
                {(["belum", "sudah"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusBaca({ ...statusBaca, tab })}
                    className={`h-9 rounded-xl text-xs font-extrabold transition ${
                      statusBaca.tab === tab
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {tab === "belum" ? "Belum Baca" : "Sudah Baca"}
                    {!statusBaca.loading && ` (${statusBaca[tab].length})`}
                  </button>
                ))}
              </div>

              <div className="max-h-[55vh] overflow-y-auto -mx-2">
                {statusBaca.loading ? (
                  <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Memuat...</div>
                ) : statusBaca.error ? (
                  <div className="rounded-2xl px-4 py-3 text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300">{statusBaca.error}</div>
                ) : statusBaca[statusBaca.tab].length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    {statusBaca.tab === "belum" ? "Semua karyawan sudah membaca." : "Belum ada yang membaca."}
                  </div>
                ) : (
                  statusBaca[statusBaca.tab].map((row, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 px-2 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{row.nama}</div>
                        {(row.jabatan || row.divisi) && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {[row.jabatan, row.divisi].filter(Boolean).join(" • ")}
                          </div>
                        )}
                      </div>
                      {row.dibacaAt && <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">{row.dibacaAt}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAsetPerawatan, deleteAsetPerawatan } from "@/app/actions/perawatan";
import type { AsetItem } from "./page";

const KATEGORI_OPTIONS = ["AC", "Genset", "Kendaraan", "Gedung", "Lainnya"];
const DUE_SOON_DAYS = 14;

type Status = "terlambat" | "segera" | "terjadwal";

function getStatus(tanggalBerikutnya: string): Status {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(tanggalBerikutnya);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "terlambat";
  if (diffDays <= DUE_SOON_DAYS) return "segera";
  return "terjadwal";
}

const STATUS_LABEL: Record<Status, string> = {
  terlambat: "Terlambat",
  segera: "Segera",
  terjadwal: "Terjadwal",
};

const STATUS_BADGE: Record<Status, string> = {
  terlambat: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40",
  segera: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40",
  terjadwal: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40",
};

function formatDateDisplay(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

const emptyForm = {
  id: 0,
  nama_aset: "",
  kategori: KATEGORI_OPTIONS[0],
  lokasi: "",
  tanggal_servis_terakhir: "",
  tanggal_servis_berikutnya: "",
  catatan: "",
};

export default function KalenderPerawatanClient({ items }: { items: AsetItem[] }) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const summary = useMemo(() => {
    let terlambat = 0;
    let segera = 0;
    for (const item of items) {
      const status = getStatus(item.tanggal_servis_berikutnya);
      if (status === "terlambat") terlambat += 1;
      if (status === "segera") segera += 1;
    }
    return { total: items.length, terlambat, segera };
  }, [items]);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (item: AsetItem) => {
    setForm({
      id: item.id,
      nama_aset: item.nama_aset,
      kategori: item.kategori,
      lokasi: item.lokasi ?? "",
      tanggal_servis_terakhir: item.tanggal_servis_terakhir ?? "",
      tanggal_servis_berikutnya: item.tanggal_servis_berikutnya,
      catatan: item.catatan ?? "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const result = await saveAsetPerawatan(formData);

    if (result?.error) {
      setFormError(result.error);
    } else {
      setIsModalOpen(false);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jadwal perawatan ini?")) return;
    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", String(id));
    const result = await deleteAsetPerawatan(formData);
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Kalender Perawatan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Jadwal servis aset & fasilitas kantor (AC, genset, kendaraan, gedung, dll).</p>
        </div>
        <button
          onClick={openAdd}
          className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition shrink-0"
        >
          + Tambah Jadwal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Total Aset</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{summary.total}</div>
        </div>
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">Segera ({DUE_SOON_DAYS} hari)</div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">{summary.segera}</div>
        </div>
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-400">Terlambat</div>
          <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-2">{summary.terlambat}</div>
        </div>
      </div>

      <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="font-extrabold text-slate-900 dark:text-white">Daftar Aset</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              <tr className="h-12">
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Aset</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Kategori</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Lokasi</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Servis Terakhir</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Servis Berikutnya</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Status</th>
                <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Belum ada jadwal perawatan.</td>
                </tr>
              ) : (
                items.map((item) => {
                  const status = getStatus(item.tanggal_servis_berikutnya);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">{item.nama_aset}</div>
                        {item.catatan && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs truncate">{item.catatan}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{item.lokasi || "-"}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{formatDateDisplay(item.tanggal_servis_terakhir)}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{formatDateDisplay(item.tanggal_servis_berikutnya)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${STATUS_BADGE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="h-9 px-4 rounded-2xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            className="h-9 px-4 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 disabled:opacity-60 transition"
                          >
                            {deletingId === item.id ? "..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{form.id ? "Edit Jadwal" : "Tambah Jadwal"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="rounded-2xl px-4 py-3 text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40">
                  {formError}
                </div>
              )}

              <input type="hidden" name="id" value={form.id} />

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Nama Aset</label>
                <input
                  name="nama_aset"
                  required
                  value={form.nama_aset}
                  onChange={(e) => setForm({ ...form, nama_aset: e.target.value })}
                  placeholder="Contoh: AC Ruang Meeting Lt. 2"
                  className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Kategori</label>
                  <select
                    name="kategori"
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                  >
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Lokasi</label>
                  <input
                    name="lokasi"
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    placeholder="Opsional"
                    className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Servis Terakhir</label>
                  <input
                    type="date"
                    name="tanggal_servis_terakhir"
                    value={form.tanggal_servis_terakhir}
                    onChange={(e) => setForm({ ...form, tanggal_servis_terakhir: e.target.value })}
                    className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Servis Berikutnya</label>
                  <input
                    type="date"
                    name="tanggal_servis_berikutnya"
                    required
                    value={form.tanggal_servis_berikutnya}
                    onChange={(e) => setForm({ ...form, tanggal_servis_berikutnya: e.target.value })}
                    className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Catatan</label>
                <textarea
                  name="catatan"
                  rows={3}
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Opsional"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 flex-1 rounded-2xl bg-slate-100 dark:bg-slate-700 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 disabled:opacity-60 transition"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

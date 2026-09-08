"use client";

import { useState } from "react";
import { saveAsetRiwayat } from "@/app/actions/asetRiwayat";
import type { RiwayatItem } from "./page";

const inputClass =
  "mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition";
const labelClass = "text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400";

export default function RiwayatFormModal({
  asetId,
  jumlahDefault,
  initial,
  onClose,
  onSaved,
}: {
  asetId: number;
  jumlahDefault: number;
  initial: RiwayatItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id ?? 0,
    sejak_tanggal: initial?.sejak_tanggal ?? "",
    penanggung_jawab: initial?.penanggung_jawab ?? "",
    lokasi: initial?.lokasi ?? "",
    jumlah: String(initial?.jumlah ?? jumlahDefault),
    kondisi_persen: String(initial?.kondisi_persen ?? 100),
    kelengkapan_persen: String(initial?.kelengkapan_persen ?? 100),
    keterangan: initial?.keterangan ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const result = await saveAsetRiwayat(formData);

    if (result?.error) {
      setFormError(result.error);
      setIsSubmitting(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{form.id ? "Edit Riwayat" : "Tambah Riwayat"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
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
          <input type="hidden" name="aset_id" value={asetId} />

          <div>
            <label className={labelClass}>Sejak Tanggal</label>
            <input type="date" name="sejak_tanggal" required value={form.sejak_tanggal} onChange={set("sejak_tanggal")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Penanggung Jawab</label>
            <input name="penanggung_jawab" required value={form.penanggung_jawab} onChange={set("penanggung_jawab")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lokasi</label>
            <input name="lokasi" required value={form.lokasi} onChange={set("lokasi")} className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Jumlah</label>
              <input type="number" min={1} name="jumlah" required value={form.jumlah} onChange={set("jumlah")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kondisi (%)</label>
              <input type="number" min={0} max={100} name="kondisi_persen" value={form.kondisi_persen} onChange={set("kondisi_persen")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kelengkapan (%)</label>
              <input type="number" min={0} max={100} name="kelengkapan_persen" value={form.kelengkapan_persen} onChange={set("kelengkapan_persen")} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Keterangan</label>
            <textarea
              name="keterangan"
              rows={3}
              value={form.keterangan}
              onChange={set("keterangan")}
              placeholder="Deskripsi tambahan, catatan, atau keterangan lainnya"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-11 flex-1 rounded-2xl bg-slate-100 dark:bg-slate-700 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 disabled:opacity-60 transition">
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

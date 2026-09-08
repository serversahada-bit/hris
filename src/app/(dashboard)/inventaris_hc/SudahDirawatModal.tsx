"use client";

import { useState } from "react";
import { markAsetDirawat } from "@/app/actions/aset";

const inputClass =
  "mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 transition";
const labelClass = "text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function SudahDirawatModal({
  asetId,
  onClose,
  onSaved,
}: {
  asetId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    tanggal: todayInputValue(),
    nominal: "",
    keterangan: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const result = await markAsetDirawat(formData);

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
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Tandai Sudah Dirawat</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="rounded-2xl px-4 py-3 text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40">
              {formError}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
            Jadwal perawatan akan dihitung ulang dari tanggal ini. Isi Nominal kalau perawatan ini ada biayanya — otomatis tercatat sebagai transaksi baru di tab Keuangan.
          </p>

          <input type="hidden" name="id" value={asetId} />

          <div>
            <label className={labelClass}>Tanggal Dirawat</label>
            <input type="date" name="tanggal" required value={form.tanggal} onChange={set("tanggal")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nominal (Rp)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              name="nominal"
              value={form.nominal}
              onChange={set("nominal")}
              placeholder="Opsional"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Keterangan</label>
            <input
              name="keterangan"
              value={form.keterangan}
              onChange={set("keterangan")}
              placeholder="Contoh: Servis Rutin"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-11 flex-1 rounded-2xl bg-slate-100 dark:bg-slate-700 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="h-11 flex-1 rounded-2xl font-extrabold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-95 disabled:opacity-60 transition">
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { kirimNotifikasiBroadcast } from "@/app/actions/notifikasi";

export default function NotifikasiForm() {
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (formData: FormData) => {
    setResult(null);
    startTransition(async () => {
      const res = await kirimNotifikasiBroadcast(formData);
      if (res.success) {
        setResult({ ok: true, message: `Notifikasi terkirim ke ${res.sent} perangkat.` });
        formRef.current?.reset();
        setImagePreview(null);
      } else {
        setResult({ ok: false, message: res.error || "Gagal mengirim notifikasi." });
      }
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {result && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Judul
        </label>
        <input
          type="text"
          name="title"
          required
          maxLength={80}
          placeholder="Contoh: Pengumuman Libur Nasional"
          className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Isi Pesan
        </label>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={200}
          placeholder="Tulis isi pengumuman di sini..."
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Gambar (opsional)
        </label>

        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Hapus gambar"
            >
              &times;
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-6 text-sm font-semibold text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            Upload Gambar (JPG/PNG/WEBP, maks 3MB)
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Catatan: gambar tidak muncul di notifikasi iPhone (keterbatasan iOS).
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Link Tujuan (opsional)
        </label>
        <input
          type="text"
          name="url"
          placeholder="/dashboard"
          className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Mengirim..." : "Kirim Notifikasi"}
      </button>
    </form>
  );
}

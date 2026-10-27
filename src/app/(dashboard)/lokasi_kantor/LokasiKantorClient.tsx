"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveKantor, deleteKantor } from "@/app/actions/kantor";
import { useAlert } from "@/components/AlertProvider";
import { mapsUrl, osmEmbedUrl, parseKoordinat } from "@/lib/kantorUtils";
import type { KantorItem } from "./page";

const emptyForm = { id: 0, nama: "", alamat: "", koordinat: "", radius: "10", isAktif: true };

const inputBase =
  "w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition";
const inputClass = `mt-2 ${inputBase}`;
const labelClass = "text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400";

export default function LokasiKantorClient({ items }: { items: KantorItem[] }) {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [isLocating, setIsLocating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const titik = parseKoordinat(form.koordinat);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (item: KantorItem) => {
    setForm({
      id: item.id,
      nama: item.nama,
      alamat: item.alamat,
      koordinat: `${item.lat}, ${item.lon}`,
      radius: String(item.radius),
      isAktif: item.isAktif,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const pakaiLokasiSaya = () => {
    if (!navigator.geolocation) {
      setFormError("Browser tidak mendukung GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({ ...prev, koordinat: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` }));
        setIsLocating(false);
      },
      (err) => {
        setFormError(`Gagal mengambil lokasi: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const result = await saveKantor(new FormData(e.currentTarget));
    if (result?.error) {
      setFormError(result.error);
    } else {
      setIsModalOpen(false);
      router.refresh();
      showAlert("Data kantor tersimpan.", "success");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (item: KantorItem) => {
    if (!confirm(`Hapus kantor "${item.nama}"?`)) return;
    setDeletingId(item.id);
    const formData = new FormData();
    formData.set("id", String(item.id));
    const result = await deleteKantor(formData);
    if (result?.error) {
      showAlert(result.error, "error");
    } else {
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Lokasi Kantor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Acuan jarak absen di Great. Saat absen masuk/pulang, lokasi karyawan dibandingkan dengan kantor aktif terdekat.
            Di luar radius, karyawan melihat peringatan tetapi tetap bisa absen.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition shrink-0"
        >
          + Tambah Kantor
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <span className="material-symbols-outlined text-5xl mb-3 text-slate-300 dark:text-slate-600">location_on</span>
          <div className="font-extrabold text-slate-800 dark:text-slate-200">Belum ada kantor</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Selama belum ada kantor aktif, jarak absen tidak dicek.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
            <section
              key={item.id}
              className={`rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden ${
                item.isAktif ? "" : "opacity-60"
              }`}
            >
              <iframe
                title={`Peta ${item.nama}`}
                src={osmEmbedUrl(item.lat, item.lon)}
                className="w-full h-40 border-0 bg-slate-100 dark:bg-slate-900"
                loading="lazy"
              />
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-extrabold text-slate-900 dark:text-white text-lg">{item.nama}</div>
                    {!item.isAktif && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  {item.alamat && <div className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{item.alamat}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold">
                    <a
                      href={mapsUrl(item.lat, item.lon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                    >
                      <span className="material-symbols-outlined text-base">location_on</span>
                      {item.lat}, {item.lon}
                    </a>
                    <span className="inline-flex items-center gap-1 text-brand-700 dark:text-brand-400">
                      <span className="material-symbols-outlined text-base">radar</span>
                      Radius {item.radius} m
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    className="h-9 px-4 rounded-2xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item)}
                    className="h-9 px-4 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 disabled:opacity-60 transition"
                  >
                    {deletingId === item.id ? "..." : "Hapus"}
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{form.id ? "Edit Kantor" : "Tambah Kantor"}</h3>
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
                <label className={labelClass}>Nama Kantor</label>
                <input
                  name="nama"
                  required
                  maxLength={100}
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: Kantor Pusat"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Alamat</label>
                <textarea
                  name="alamat"
                  rows={2}
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Alamat lengkap kantor"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>

              <div>
                <label className={labelClass}>Titik Koordinat</label>
                <div className="mt-2 flex gap-2">
                  <input
                    name="koordinat"
                    required
                    value={form.koordinat}
                    onChange={(e) => setForm({ ...form, koordinat: e.target.value })}
                    placeholder="-7.629952, 111.540949"
                    className={`${inputBase} flex-1 min-w-0`}
                  />
                  <button
                    type="button"
                    onClick={pakaiLokasiSaya}
                    disabled={isLocating}
                    title="Pakai lokasi saya sekarang"
                    className="h-11 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 transition flex items-center gap-1 text-xs font-extrabold shrink-0"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isLocating ? "animate-pulse" : ""}`}>my_location</span>
                    Lokasi saya
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Buka Google Maps, klik kanan tepat di gedung kantor, lalu klik angka koordinat paling atas untuk menyalinnya. Atau tekan
                  &quot;Lokasi saya&quot; saat Anda sedang berada di kantor.
                </div>
                {form.koordinat.trim() && !titik && (
                  <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">Format koordinat belum valid.</div>
                )}
                {titik && (
                  <iframe
                    title="Pratinjau lokasi"
                    src={osmEmbedUrl(titik.lat, titik.lon)}
                    className="mt-3 w-full h-48 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                  />
                )}
              </div>

              <div>
                <label className={labelClass}>Radius (meter)</label>
                <input
                  type="number"
                  name="radius_meter"
                  required
                  min={1}
                  max={5000}
                  step={1}
                  value={form.radius}
                  onChange={(e) => setForm({ ...form, radius: e.target.value })}
                  className={inputClass}
                />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Absen lebih jauh dari ini dianggap di luar kantor. GPS HP di dalam gedung bisa meleset 5–20 m.
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <input
                  type="checkbox"
                  name="is_aktif"
                  value="1"
                  checked={form.isAktif}
                  onChange={(e) => setForm({ ...form, isAktif: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-extrabold text-slate-900 dark:text-white">Aktif</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hanya kantor aktif yang dipakai sebagai acuan jarak absen.</span>
                </span>
              </label>

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

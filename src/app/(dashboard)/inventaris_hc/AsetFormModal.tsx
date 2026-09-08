"use client";

import { useRef, useState } from "react";
import { saveAset } from "@/app/actions/aset";
import type { AsetItem } from "./page";

export const KATEGORI_OPTIONS = [
  "Elektronik",
  "Furniture",
  "Komputer",
  "Kendaraan",
  "Peralatan Kantor",
  "Gedung & Bangunan",
  "Lainnya",
];
export const KONDISI_OPTIONS = ["Baik", "Rusak Ringan", "Rusak Berat"];

export type AsetFormValues = {
  id: number;
  nama_aset: string;
  kode_aset: string;
  kategori: string;
  merk: string;
  tipe: string;
  produsen: string;
  no_seri: string;
  tahun_produksi: string;
  deskripsi: string;
  toko_distributor: string;
  no_invoice: string;
  tanggal_pembelian: string;
  jumlah: string;
  harga_satuan: string;
  umur_ekonomis_tahun: string;
  kondisi: string;
  lokasi: string;
  penanggung_jawab: string;
  catatan: string;
  interval_perawatan_hari: string;
  tanggal_perawatan_terakhir: string;
};

export const emptyAsetForm: AsetFormValues = {
  id: 0,
  nama_aset: "",
  kode_aset: "",
  kategori: KATEGORI_OPTIONS[0],
  merk: "",
  tipe: "",
  produsen: "",
  no_seri: "",
  tahun_produksi: "",
  deskripsi: "",
  toko_distributor: "",
  no_invoice: "",
  tanggal_pembelian: "",
  jumlah: "1",
  harga_satuan: "",
  umur_ekonomis_tahun: "5",
  kondisi: KONDISI_OPTIONS[0],
  lokasi: "",
  penanggung_jawab: "",
  catatan: "",
  interval_perawatan_hari: "",
  tanggal_perawatan_terakhir: "",
};

export function asetToFormValues(item: AsetItem): AsetFormValues {
  return {
    id: item.id,
    nama_aset: item.nama_aset,
    kode_aset: item.kode_aset ?? "",
    kategori: item.kategori,
    merk: item.merk ?? "",
    tipe: item.tipe ?? "",
    produsen: item.produsen ?? "",
    no_seri: item.no_seri ?? "",
    tahun_produksi: item.tahun_produksi ?? "",
    deskripsi: item.deskripsi ?? "",
    toko_distributor: item.toko_distributor ?? "",
    no_invoice: item.no_invoice ?? "",
    tanggal_pembelian: item.tanggal_pembelian ?? "",
    jumlah: String(item.jumlah),
    harga_satuan: String(item.harga_satuan),
    umur_ekonomis_tahun: String(item.umur_ekonomis_tahun),
    kondisi: item.kondisi,
    lokasi: item.lokasi ?? "",
    penanggung_jawab: item.penanggung_jawab ?? "",
    catatan: item.catatan ?? "",
    interval_perawatan_hari: item.interval_perawatan_hari ? String(item.interval_perawatan_hari) : "",
    tanggal_perawatan_terakhir: item.tanggal_perawatan_terakhir ?? "",
  };
}

const inputClass =
  "mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition";
const labelClass = "text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400";
const sectionTitleClass = "text-xs font-extrabold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-400 pt-2";

export default function AsetFormModal({
  initial,
  currentFotoUrl,
  onClose,
  onSaved,
}: {
  initial: AsetFormValues;
  currentFotoUrl: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof AsetFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const result = await saveAset(formData);

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
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{form.id ? "Edit Aset" : "Tambah Aset"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto" encType="multipart/form-data">
          {formError && (
            <div className="rounded-2xl px-4 py-3 text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40">
              {formError}
            </div>
          )}

          <input type="hidden" name="id" value={form.id} />

          <div className={sectionTitleClass}>Umum</div>
          <div>
            <label className={labelClass}>Nama Aset</label>
            <input name="nama_aset" required value={form.nama_aset} onChange={set("nama_aset")} placeholder="Contoh: Laptop Asus" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kode Aset</label>
              <input name="kode_aset" value={form.kode_aset} onChange={set("kode_aset")} placeholder="Opsional, contoh: 21/INV/2023" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kategori</label>
              <select name="kategori" value={form.kategori} onChange={set("kategori")} className={inputClass}>
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={sectionTitleClass}>Detail Aset</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Merk</label>
              <input name="merk" value={form.merk} onChange={set("merk")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tipe</label>
              <input name="tipe" value={form.tipe} onChange={set("tipe")} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Produsen</label>
              <input name="produsen" value={form.produsen} onChange={set("produsen")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>No. Seri</label>
              <input name="no_seri" value={form.no_seri} onChange={set("no_seri")} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Tahun Produksi</label>
            <input name="tahun_produksi" value={form.tahun_produksi} onChange={set("tahun_produksi")} placeholder="Contoh: 2023" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea name="deskripsi" rows={2} value={form.deskripsi} onChange={set("deskripsi")} placeholder="Warna, spesifikasi, dll. (opsional)" className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition" />
          </div>

          <div className={sectionTitleClass}>Pembelian</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Toko / Distributor</label>
              <input name="toko_distributor" value={form.toko_distributor} onChange={set("toko_distributor")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>No. Invoice</label>
              <input name="no_invoice" value={form.no_invoice} onChange={set("no_invoice")} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Tanggal Pembelian</label>
            <input type="date" name="tanggal_pembelian" value={form.tanggal_pembelian} onChange={set("tanggal_pembelian")} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Jumlah</label>
              <input type="number" min={1} name="jumlah" required value={form.jumlah} onChange={set("jumlah")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Harga Satuan (Rp)</label>
              <input type="number" min={0} step="0.01" name="harga_satuan" required value={form.harga_satuan} onChange={set("harga_satuan")} className={inputClass} />
            </div>
          </div>

          <div className={sectionTitleClass}>Penyusutan</div>
          <div>
            <label className={labelClass}>Umur Ekonomis (Tahun)</label>
            <input type="number" min={1} name="umur_ekonomis_tahun" required value={form.umur_ekonomis_tahun} onChange={set("umur_ekonomis_tahun")} className={inputClass} />
          </div>

          <div className={sectionTitleClass}>Jadwal Perawatan</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Interval Perawatan (Hari)</label>
              <input
                type="number"
                min={1}
                name="interval_perawatan_hari"
                value={form.interval_perawatan_hari}
                onChange={set("interval_perawatan_hari")}
                placeholder="Kosongkan jika tidak perlu"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Terakhir Dirawat</label>
              <input
                type="date"
                name="tanggal_perawatan_terakhir"
                value={form.tanggal_perawatan_terakhir}
                onChange={set("tanggal_perawatan_terakhir")}
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
            Isi interval kalau aset ini butuh perawatan berkala (servis AC, ganti oli, dll). Jadwal berikutnya dihitung otomatis dari tanggal terakhir dirawat (atau tanggal pembelian bila belum pernah).
          </p>

          <div className={sectionTitleClass}>Status & Lokasi</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kondisi</label>
              <select name="kondisi" value={form.kondisi} onChange={set("kondisi")} className={inputClass}>
                {KONDISI_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Penanggung Jawab</label>
              <input name="penanggung_jawab" value={form.penanggung_jawab} onChange={set("penanggung_jawab")} placeholder="Opsional" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Lokasi</label>
            <input name="lokasi" value={form.lokasi} onChange={set("lokasi")} placeholder="Opsional" className={inputClass} />
          </div>

          <div className={sectionTitleClass}>Foto</div>
          <div className="flex items-center gap-4">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview foto aset" className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              Ganti Foto
            </button>
            <input ref={fileInputRef} type="file" name="foto" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} className="hidden" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">Ukuran maksimal 5MB. Tipe file yang diizinkan: jpg, jpeg, gif, png.</p>

          <div>
            <label className={labelClass}>Keterangan</label>
            <textarea name="catatan" rows={3} value={form.catatan} onChange={set("catatan")} placeholder="Opsional" className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition" />
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

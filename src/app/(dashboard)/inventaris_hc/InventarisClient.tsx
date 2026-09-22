"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRupiah, hitungPenyusutan, hitungJadwalPerawatan, type StatusPerawatan } from "@/lib/asetUtils";
import { deleteAset } from "@/app/actions/aset";
import { useAlert } from "@/components/AlertProvider";
import AsetFormModal, { emptyAsetForm, KATEGORI_OPTIONS, type AsetFormValues } from "./AsetFormModal";
import AsetCharts from "./AsetCharts";
import SudahDirawatModal from "./SudahDirawatModal";
import type { AsetItem } from "./page";

const PERAWATAN_LIST_MAX_DAYS = 30;

function formatDateDisplay(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

const KONDISI_BADGE: Record<string, string> = {
  Baik: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40",
  "Rusak Ringan": "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40",
  "Rusak Berat": "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40",
};

const PERAWATAN_LABEL: Record<StatusPerawatan, string> = {
  terlambat: "Terlambat",
  segera: "Segera",
  terjadwal: "Terjadwal",
};

const PERAWATAN_BADGE: Record<StatusPerawatan, string> = {
  terlambat: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40",
  segera: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40",
  terjadwal: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40",
};

export default function InventarisClient({ items }: { items: AsetItem[] }) {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [view, setView] = useState<"aset" | "perawatan">("aset");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<AsetFormValues>(emptyAsetForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dirawatAssetId, setDirawatAssetId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("Semua");

  const enriched = useMemo(
    () =>
      items.map((item) => {
        const hargaTotal = item.harga_satuan * item.jumlah;
        const penyusutan = hitungPenyusutan(hargaTotal, item.umur_ekonomis_tahun, item.tanggal_pembelian);
        const perawatan = hitungJadwalPerawatan(item.tanggal_pembelian, item.tanggal_perawatan_terakhir, item.interval_perawatan_hari);
        return { ...item, hargaTotal, ...penyusutan, perawatan };
      }),
    [items]
  );

  const summary = useMemo(() => {
    let rusakRingan = 0;
    let rusakBerat = 0;
    let totalNilaiSekarang = 0;
    let totalNilaiAwal = 0;
    for (const item of enriched) {
      if (item.kondisi === "Rusak Ringan") rusakRingan += 1;
      if (item.kondisi === "Rusak Berat") rusakBerat += 1;
      totalNilaiSekarang += item.nilaiSekarang;
      totalNilaiAwal += item.hargaTotal;
    }
    return { totalAset: enriched.length, totalNilaiAwal, totalNilaiSekarang, rusakRingan, rusakBerat };
  }, [enriched]);

  const filteredItems = useMemo(() => {
    return enriched.filter((item) => {
      const matchKategori = kategoriFilter === "Semua" || item.kategori === kategoriFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.nama_aset.toLowerCase().includes(q) ||
        (item.kode_aset ?? "").toLowerCase().includes(q) ||
        (item.lokasi ?? "").toLowerCase().includes(q);
      return matchKategori && matchSearch;
    });
  }, [enriched, search, kategoriFilter]);

  const perawatanItems = useMemo(() => {
    return filteredItems
      .filter((item) => item.perawatan.status !== null && item.perawatan.sisaHari !== null && item.perawatan.sisaHari <= PERAWATAN_LIST_MAX_DAYS)
      .sort((a, b) => (a.perawatan.sisaHari as number) - (b.perawatan.sisaHari as number));
  }, [filteredItems]);

  const handleDirawatSaved = () => {
    setDirawatAssetId(null);
    router.refresh();
  };

  const openAdd = () => {
    setFormInitial(emptyAsetForm);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus aset ini beserta datanya?")) return;
    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", String(id));
    const result = await deleteAset(formData);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Inventaris Aset</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Data aset kantor beserta nilai penyusutannya.</p>
        </div>
        <button
          onClick={openAdd}
          className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition shrink-0"
        >
          + Tambah Aset
        </button>
      </div>

      <AsetCharts items={enriched} summary={summary} />

      <div className="flex gap-1">
        <button
          onClick={() => setView("aset")}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] border-b-2 transition ${
            view === "aset"
              ? "border-brand-600 text-brand-700 dark:text-brand-400"
              : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          Daftar Aset
        </button>
        <button
          onClick={() => setView("perawatan")}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] border-b-2 transition inline-flex items-center gap-2 ${
            view === "perawatan"
              ? "border-brand-600 text-brand-700 dark:text-brand-400"
              : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          Daftar Perawatan
          {perawatanItems.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
              {perawatanItems.length}
            </span>
          )}
        </button>
      </div>

      <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-extrabold text-slate-900 dark:text-white">
            {view === "aset" ? "Daftar Aset" : `Daftar Perawatan (≤30 hari)`}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kode, atau lokasi..."
              className="h-10 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
            />
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="h-10 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
            >
              <option value="Semua">Semua Kategori</option>
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {view === "aset" ? (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
                <tr className="h-12">
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Aset</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Kode</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Kategori</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Merk &amp; Tipe</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Nilai Sekarang</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Kondisi</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Perawatan</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {items.length === 0 ? "Belum ada data aset." : "Tidak ada data yang cocok."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <Link href={`/inventaris_hc/${item.id}`} className="font-extrabold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition">
                          {item.nama_aset}
                        </Link>
                        {item.lokasi && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.lokasi}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                        <div>{item.kode_aset || "-"}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{item.kode_sistem}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {[item.merk, item.tipe].filter(Boolean).join(" ") || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{formatRupiah(item.nilaiSekarang)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${KONDISI_BADGE[item.kondisi] ?? ""}`}>
                          {item.kondisi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.perawatan.status ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${PERAWATAN_BADGE[item.perawatan.status]}`}>
                            {PERAWATAN_LABEL[item.perawatan.status]}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/inventaris_hc/${item.id}`}
                            className="h-9 px-4 rounded-2xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition inline-flex items-center"
                          >
                            Lihat
                          </Link>
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
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
                <tr className="h-12">
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Aset</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Interval</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Terakhir Dirawat</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em]">Jadwal Berikutnya</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Sisa Hari</th>
                  <th className="px-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {perawatanItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada aset yang perlu perawatan dalam 30 hari ke depan.
                    </td>
                  </tr>
                ) : (
                  perawatanItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <Link href={`/inventaris_hc/${item.id}`} className="font-extrabold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition">
                          {item.nama_aset}
                        </Link>
                        {item.lokasi && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.lokasi}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{item.interval_perawatan_hari} Hari</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{formatDateDisplay(item.tanggal_perawatan_terakhir)}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">{formatDateDisplay(item.perawatan.jadwalBerikutnya)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${PERAWATAN_BADGE[item.perawatan.status as StatusPerawatan]}`}>
                          {item.perawatan.sisaHari !== null && item.perawatan.sisaHari < 0
                            ? `Terlambat ${Math.abs(item.perawatan.sisaHari)} hari`
                            : item.perawatan.sisaHari === 0
                            ? "Hari ini"
                            : `${item.perawatan.sisaHari} hari lagi`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/inventaris_hc/${item.id}`}
                            className="h-9 px-4 rounded-2xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition inline-flex items-center"
                          >
                            Lihat
                          </Link>
                          <button
                            onClick={() => setDirawatAssetId(item.id)}
                            className="h-9 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-extrabold hover:opacity-95 transition"
                          >
                            Sudah Dirawat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {isModalOpen && <AsetFormModal initial={formInitial} currentFotoUrl={null} onClose={() => setIsModalOpen(false)} onSaved={handleSaved} />}
      {dirawatAssetId !== null && (
        <SudahDirawatModal asetId={dirawatAssetId} onClose={() => setDirawatAssetId(null)} onSaved={handleDirawatSaved} />
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRupiah, hitungPenyusutan, hitungJadwalPerawatan, type StatusPerawatan } from "@/lib/asetUtils";
import { deleteAset } from "@/app/actions/aset";
import AsetFormModal, { asetToFormValues } from "../AsetFormModal";
import SudahDirawatModal from "../SudahDirawatModal";
import AsetTabsPanel from "./AsetTabsPanel";
import type { AsetItem } from "../page";
import type { RiwayatItem, KeuanganItem } from "./page";

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

function formatDateDisplay(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{value ?? "-"}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="font-extrabold text-slate-900 dark:text-white text-sm">{title}</div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

export default function AsetDetailClient({
  item,
  riwayat,
  keuangan,
  qrDataUrl,
  qrUrl,
}: {
  item: AsetItem;
  riwayat: RiwayatItem[];
  keuangan: KeuanganItem[];
  qrDataUrl: string | null;
  qrUrl: string;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDirawatModalOpen, setIsDirawatModalOpen] = useState(false);

  const hargaTotal = item.harga_satuan * item.jumlah;
  const penyusutan = useMemo(
    () => hitungPenyusutan(hargaTotal, item.umur_ekonomis_tahun, item.tanggal_pembelian),
    [hargaTotal, item.umur_ekonomis_tahun, item.tanggal_pembelian]
  );
  const perawatan = useMemo(
    () => hitungJadwalPerawatan(item.tanggal_pembelian, item.tanggal_perawatan_terakhir, item.interval_perawatan_hari),
    [item.tanggal_pembelian, item.tanggal_perawatan_terakhir, item.interval_perawatan_hari]
  );

  const handleSaved = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  const handleDirawatSaved = () => {
    setIsDirawatModalOpen(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Hapus aset ini beserta datanya?")) return;
    setIsDeleting(true);
    const formData = new FormData();
    formData.set("id", String(item.id));
    const result = await deleteAset(formData);
    if (result?.error) {
      alert(result.error);
      setIsDeleting(false);
    } else {
      router.push("/inventaris_hc");
      router.refresh();
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/inventaris_hc" className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">{item.nama_aset}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold mt-2 ${KONDISI_BADGE[item.kondisi] ?? ""}`}>
            {item.kondisi}
          </span>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-11 px-6 rounded-2xl font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 transition inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <SectionCard title="Data Aset">
            <Field label="Nama Aset" value={item.nama_aset} />
            <Field label="Kode Aset" value={item.kode_aset} />
            <Field label="Kode Sistem" value={<span className="font-mono">{item.kode_sistem}</span>} />
            <Field label="Kategori" value={item.kategori} />
          </SectionCard>

          <SectionCard title="Foto & QR Code">
            <div className="grid grid-cols-2 gap-3">
              {item.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.fotoUrl} alt={item.nama_aset} className="w-full aspect-square rounded-2xl object-cover border border-slate-100 dark:border-slate-700" />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <span className="material-symbols-outlined text-[40px]">image</span>
                </div>
              )}
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`QR Code ${item.nama_aset}`} className="w-full aspect-square rounded-2xl object-contain border border-slate-100 dark:border-slate-700 bg-white p-2" />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <span className="material-symbols-outlined text-[40px]">qr_code_2</span>
                </div>
              )}
            </div>
            {qrDataUrl && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={qrUrl}>{qrUrl}</span>
                <a
                  href={qrDataUrl}
                  download={`qr-${item.kode_sistem}.png`}
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Unduh
                </a>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <SectionCard title="Detail Aset">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Merk" value={item.merk} />
              <Field label="Tipe" value={item.tipe} />
              <Field label="Produsen" value={item.produsen} />
              <Field label="Tahun Produksi" value={item.tahun_produksi} />
              <Field label="No. Seri" value={item.no_seri} />
              <Field label="Lokasi" value={item.lokasi} />
              <Field label="Penanggung Jawab" value={item.penanggung_jawab} />
              <Field label="Jumlah" value={`${item.jumlah} unit`} />
            </div>
            {item.deskripsi && <Field label="Deskripsi" value={item.deskripsi} />}
          </SectionCard>

          <SectionCard title="Pembelian">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Pembelian" value={formatDateDisplay(item.tanggal_pembelian)} />
              <Field label="Toko / Distributor" value={item.toko_distributor} />
              <Field label="No. Invoice" value={item.no_invoice} />
              <Field label="Harga Satuan" value={formatRupiah(item.harga_satuan)} />
              <Field label="Harga Total" value={formatRupiah(hargaTotal)} />
            </div>
          </SectionCard>

          <SectionCard title="Penyusutan">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Umur Ekonomis" value={`${item.umur_ekonomis_tahun} Tahun`} />
              <Field label="Usia Aset" value={`${penyusutan.usiaBulan} Bulan`} />
              <Field label="Penyusutan / Bulan" value={formatRupiah(penyusutan.penyusutanPerBulan)} />
              <Field label="Total Penyusutan" value={formatRupiah(penyusutan.totalPenyusutan)} />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">Nilai Sekarang</div>
              <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{formatRupiah(penyusutan.nilaiSekarang)}</div>
            </div>
          </SectionCard>

          {item.interval_perawatan_hari && (
            <SectionCard title="Perawatan">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Interval Perawatan" value={`${item.interval_perawatan_hari} Hari`} />
                <Field label="Terakhir Dirawat" value={formatDateDisplay(item.tanggal_perawatan_terakhir)} />
                <Field label="Jadwal Berikutnya" value={formatDateDisplay(perawatan.jadwalBerikutnya)} />
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Status</div>
                  <div className="mt-1">
                    {perawatan.status && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${PERAWATAN_BADGE[perawatan.status]}`}>
                        {PERAWATAN_LABEL[perawatan.status]}
                        {perawatan.sisaHari !== null && perawatan.sisaHari >= 0 && ` (${perawatan.sisaHari} hari lagi)`}
                        {perawatan.sisaHari !== null && perawatan.sisaHari < 0 && ` (${Math.abs(perawatan.sisaHari)} hari lewat)`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setIsDirawatModalOpen(true)}
                  className="h-10 px-5 rounded-2xl font-extrabold text-white text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-95 transition inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  Sudah Dirawat
                </button>
              </div>
            </SectionCard>
          )}

          {item.catatan && (
            <SectionCard title="Keterangan">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{item.catatan}</p>
            </SectionCard>
          )}
        </div>
      </div>

      <AsetTabsPanel asetId={item.id} jumlahDefault={item.jumlah} riwayat={riwayat} keuangan={keuangan} />

      {isModalOpen && (
        <AsetFormModal initial={asetToFormValues(item)} currentFotoUrl={item.fotoUrl} onClose={() => setIsModalOpen(false)} onSaved={handleSaved} />
      )}
      {isDirawatModalOpen && (
        <SudahDirawatModal asetId={item.id} onClose={() => setIsDirawatModalOpen(false)} onSaved={handleDirawatSaved} />
      )}
    </div>
  );
}

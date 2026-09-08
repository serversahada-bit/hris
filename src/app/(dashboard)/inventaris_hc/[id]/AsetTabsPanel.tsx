"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/asetUtils";
import { deleteAsetRiwayat } from "@/app/actions/asetRiwayat";
import { deleteAsetKeuangan } from "@/app/actions/asetKeuangan";
import RiwayatFormModal from "./RiwayatFormModal";
import KeuanganFormModal from "./KeuanganFormModal";
import type { RiwayatItem, KeuanganItem } from "./page";

type Tab = "riwayat" | "keuangan";

function formatDateDisplay(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export default function AsetTabsPanel({
  asetId,
  jumlahDefault,
  riwayat,
  keuangan,
}: {
  asetId: number;
  jumlahDefault: number;
  riwayat: RiwayatItem[];
  keuangan: KeuanganItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("riwayat");

  const [riwayatModal, setRiwayatModal] = useState<{ open: boolean; item: RiwayatItem | null }>({ open: false, item: null });
  const [keuanganModal, setKeuanganModal] = useState<{ open: boolean; item: KeuanganItem | null }>({ open: false, item: null });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalPengeluaran = useMemo(() => keuangan.reduce((sum, k) => sum + k.nominal, 0), [keuangan]);

  const handleSaved = () => {
    setRiwayatModal({ open: false, item: null });
    setKeuanganModal({ open: false, item: null });
    router.refresh();
  };

  const handleDeleteRiwayat = async (id: number) => {
    if (!confirm("Hapus riwayat ini?")) return;
    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("aset_id", String(asetId));
    const result = await deleteAsetRiwayat(formData);
    if (result?.error) alert(result.error);
    else router.refresh();
    setDeletingId(null);
  };

  const handleDeleteKeuangan = async (id: number) => {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("aset_id", String(asetId));
    const result = await deleteAsetKeuangan(formData);
    if (result?.error) alert(result.error);
    else router.refresh();
    setDeletingId(null);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "riwayat", label: "Riwayat" },
    { key: "keuangan", label: "Keuangan" },
  ];

  return (
    <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] border-b-2 transition ${
                tab === t.key
                  ? "border-brand-600 text-brand-700 dark:text-brand-400"
                  : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            tab === "riwayat" ? setRiwayatModal({ open: true, item: null }) : setKeuanganModal({ open: true, item: null })
          }
          className="mb-3 h-9 px-4 rounded-2xl font-extrabold text-white text-xs bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition shrink-0"
        >
          + {tab === "riwayat" ? "Riwayat" : "Transaksi"}
        </button>
      </div>

      {tab === "riwayat" ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {riwayat.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Belum ada riwayat.</div>
          ) : (
            riwayat.map((r) => (
              <div key={r.id} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Sejak Tanggal</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{formatDateDisplay(r.sejak_tanggal)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Penanggung Jawab</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.penanggung_jawab}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Lokasi</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.lokasi}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Jumlah</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.jumlah} Unit</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Kondisi</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.kondisi_persen}%</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Kelengkapan</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.kelengkapan_persen}%</div>
                  </div>
                  {r.keterangan && (
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-slate-400">Keterangan</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{r.keterangan}</div>
                    </div>
                  )}
                </div>
                <div className="flex sm:flex-col gap-2 justify-start">
                  <button
                    onClick={() => setRiwayatModal({ open: true, item: r })}
                    className="h-9 px-3 rounded-2xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    disabled={deletingId === r.id}
                    onClick={() => handleDeleteRiwayat(r.id)}
                    className="h-9 px-3 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 disabled:opacity-60 transition"
                  >
                    {deletingId === r.id ? "..." : "Hapus"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {keuangan.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Belum ada transaksi.</div>
            ) : (
              keuangan.map((k) => (
                <div key={k.id} className="px-6 py-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{formatDateDisplay(k.tanggal)}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{k.keterangan}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-extrabold text-rose-600 dark:text-rose-400">{formatRupiah(k.nominal)}</div>
                    <button
                      onClick={() => setKeuanganModal({ open: true, item: k })}
                      className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition inline-flex items-center justify-center"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      disabled={deletingId === k.id}
                      onClick={() => handleDeleteKeuangan(k.id)}
                      className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-60 transition inline-flex items-center justify-center"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {keuangan.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50">
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Total Pengeluaran</div>
              <div className="font-extrabold text-slate-900 dark:text-white">{formatRupiah(totalPengeluaran)}</div>
            </div>
          )}
        </div>
      )}

      {riwayatModal.open && (
        <RiwayatFormModal
          asetId={asetId}
          jumlahDefault={jumlahDefault}
          initial={riwayatModal.item}
          onClose={() => setRiwayatModal({ open: false, item: null })}
          onSaved={handleSaved}
        />
      )}
      {keuanganModal.open && (
        <KeuanganFormModal
          asetId={asetId}
          initial={keuanganModal.item}
          onClose={() => setKeuanganModal({ open: false, item: null })}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

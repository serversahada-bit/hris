"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePengumuman, deletePengumuman, getStatusBacaPengumuman, type StatusBacaKaryawan } from "@/app/actions/pengumuman";
import { useAlert } from "@/components/AlertProvider";
import type { PengumumanItem } from "./page";

const emptyForm = { id: 0, judul: "", isi: "", tanggal: "", isPenting: false, tglNotifikasi: "", wasPenting: false };

type StatusBacaState = {
  item: PengumumanItem;
  loading: boolean;
  error: string;
  tab: "belum" | "sudah";
  sudah: StatusBacaKaryawan[];
  belum: StatusBacaKaryawan[];
};

export default function PengumumanClient({ items }: { items: PengumumanItem[] }) {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingLampiran, setEditingLampiran] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusBaca, setStatusBaca] = useState<StatusBacaState | null>(null);

  const openStatusBaca = async (item: PengumumanItem) => {
    setStatusBaca({ item, loading: true, error: "", tab: "belum", sudah: [], belum: [] });
    const result = await getStatusBacaPengumuman(item.id);
    setStatusBaca((prev) => {
      if (!prev || prev.item.id !== item.id) return prev;
      if ("error" in result) return { ...prev, loading: false, error: result.error ?? "Gagal memuat status baca." };
      return { ...prev, loading: false, sudah: result.sudah, belum: result.belum };
    });
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingLampiran(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (item: PengumumanItem) => {
    setForm({
      id: item.id,
      judul: item.judul,
      isi: item.isi,
      tanggal: item.tanggalPelaksanaan ?? "",
      isPenting: item.isPenting,
      tglNotifikasi: item.tglNotifikasi ?? "",
      wasPenting: item.isPenting,
    });
    setEditingLampiran(item.lampiranUrl);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const result = await savePengumuman(formData);

    if (result?.error) {
      setFormError(result.error);
    } else {
      setIsModalOpen(false);
      router.refresh();
      if ("pushWarning" in result && result.pushWarning) {
        showAlert(result.pushWarning, "warning");
      } else if ("message" in result && result.message) {
        showAlert(result.message, "success");
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", String(id));
    const result = await deletePengumuman(formData);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pengumuman HC</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Broadcast pengumuman HC ke seluruh karyawan. 5 agenda terdekat tampil di dashboard Great, di atas Timeline.</p>
        </div>
        <button
          onClick={openCreate}
          className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 transition shrink-0"
        >
          + Buat Pengumuman
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <span className="material-symbols-outlined text-5xl mb-3 text-slate-300 dark:text-slate-600">campaign</span>
            <div className="font-extrabold text-slate-800 dark:text-slate-200">Belum ada pengumuman</div>
          </div>
        ) : (
          items.map((item) => (
            <section
              key={item.id}
              className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPenting && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">priority_high</span>
                        Penting
                      </span>
                    )}
                    <div className="font-extrabold text-slate-900 dark:text-white text-lg">{item.judul}</div>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-400">
                    <span className="material-symbols-outlined text-base">event</span>
                    {item.tanggalPelaksanaanLabel ?? "Tanggal pelaksanaan belum diisi"}
                  </div>
                  {item.isPenting && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                      <span className="material-symbols-outlined text-base">notifications_active</span>
                      Notifikasi: {item.tglNotifikasiLabel ?? "-"}
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        • {item.pushTerkirimAt ? `push terkirim ${item.pushTerkirimAt}` : "push terjadwal 00:00 WIB"}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.updatedAt ? `Diperbarui: ${item.updatedAt}` : `Diposting: ${item.createdAt}`}
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
                    onClick={() => handleDelete(item.id)}
                    className="h-9 px-4 rounded-2xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 disabled:opacity-60 transition"
                  >
                    {deletingId === item.id ? "..." : "Hapus"}
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.isi}</div>
                {item.lampiranUrl && (
                  <a
                    href={item.lampiranUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <span className="material-symbols-outlined text-base">attach_file</span>
                    Lihat Lampiran
                  </a>
                )}
                {item.isPenting && (
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        <span>Sudah baca</span>
                        <span>
                          {item.jumlahSudahBaca} / {item.jumlahWajib}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-500"
                          style={{ width: `${item.jumlahWajib ? Math.round((item.jumlahSudahBaca / item.jumlahWajib) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => openStatusBaca(item)}
                      className="h-9 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shrink-0"
                    >
                      Lihat Status Baca
                    </button>
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{form.id ? "Edit Pengumuman" : "Buat Pengumuman"}</h3>
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
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Judul</label>
                <input
                  name="judul"
                  required
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Contoh: Libur Hari Kemerdekaan"
                  className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  name="tanggal_pelaksanaan"
                  required
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>

              <div
                className={`rounded-2xl border p-4 transition ${
                  form.isPenting
                    ? "border-rose-200 dark:border-rose-800/40 bg-rose-50/70 dark:bg-rose-500/10"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_penting"
                    value="1"
                    checked={form.isPenting}
                    onChange={(e) => setForm({ ...form, isPenting: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-rose-600"
                  />
                  <span>
                    <span className="block text-sm font-extrabold text-slate-900 dark:text-white">Penting (wajib dibaca)</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Karyawan wajib membaca pengumuman ini di Great sebelum bisa absen.
                    </span>
                  </span>
                </label>

                {form.isPenting && (
                  <div className="mt-4">
                    <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Tanggal Notifikasi</label>
                    <input
                      type="date"
                      name="tgl_notifikasi"
                      required
                      max={form.tanggal || undefined}
                      value={form.tglNotifikasi}
                      onChange={(e) => setForm({ ...form, tglNotifikasi: e.target.value })}
                      className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                    />
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      Pengumuman langsung tampil di daftar. Push notifikasi dikirim jam 00:00 WIB di tanggal ini, dan sejak tanggal ini karyawan wajib membacanya.
                    </div>
                    {form.wasPenting && (
                      <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mt-2">
                        Mengubah judul, isi, atau lampiran akan me-reset status baca: semua karyawan wajib membaca ulang.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Isi Pengumuman</label>
                <textarea
                  name="isi"
                  required
                  rows={5}
                  value={form.isi}
                  onChange={(e) => setForm({ ...form, isi: e.target.value })}
                  placeholder="Tulis isi pengumuman..."
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Lampiran (opsional)</label>
                {editingLampiran && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Lampiran saat ini:{" "}
                    <a href={editingLampiran} target="_blank" rel="noopener" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                      Lihat file
                    </a>
                    . Unggah file baru untuk menggantinya.
                  </div>
                )}
                <input
                  type="file"
                  name="lampiran"
                  accept="application/pdf,.pdf,image/*"
                  className="mt-2 w-full text-sm text-slate-600 dark:text-slate-300
                             file:mr-3 file:rounded-2xl file:border-0
                             file:bg-gradient-to-r file:from-brand-700 file:to-brand-500
                             file:px-5 file:py-3 file:text-white file:font-extrabold
                             hover:file:opacity-95"
                />
                <div className="text-[11px] text-slate-400 mt-2">Format: PDF, JPG, PNG, WEBP • Maks 10MB.</div>
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

      {statusBaca && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setStatusBaca(null)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Status Baca</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{statusBaca.item.judul}</div>
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
                        {row.jabatan && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.jabatan}</div>}
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

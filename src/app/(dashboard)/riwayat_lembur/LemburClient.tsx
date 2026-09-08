"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { approveRejectLembur, editLembur, deleteLembur } from "@/app/actions/lembur";

type LemburClientProps = {
  data: any[];
  currentParams: {
    year: string;
    status: string;
    q: string;
  };
};

export default function LemburClient({ data, currentParams }: LemburClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [modalType, setModalType] = useState<"detail" | "edit" | "approve" | "delete" | "export" | null>(null);
  const [selectedLembur, setSelectedLembur] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Export Modal State
  const [exportStart, setExportStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [exportEnd, setExportEnd] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const updateFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    
    const year = formData.get("year") as string;
    const status = formData.get("status") as string;
    const q = formData.get("q") as string;

    if (year) params.set("year", year); else params.delete("year");
    if (status) params.set("status", status); else params.delete("status");
    if (q) params.set("q", q); else params.delete("q");

    router.push(`${pathname}?${params.toString()}`);
  };

  const badgeClass = (st: string) => {
    const s = (st || "PENDING").toUpperCase();
    if (s === "APPROVED") return "bg-emerald-50 text-emerald-800 border border-emerald-200";
    if (s === "REJECTED") return "bg-rose-50 text-rose-800 border border-rose-200";
    if (s === "PENDING") return "bg-amber-50 text-amber-800 border border-amber-200";
    return "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).replace(/\./g, ":");
  };

  const formatLocalInput = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleAction = async (actionFn: Function, formData: FormData) => {
    setIsSubmitting(true);
    const res = await actionFn(formData);
    setIsSubmitting(false);
    if (res.success) {
      setModalType(null);
      alert(res.message);
    } else {
      alert(res.message || "Terjadi kesalahan");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6 bg-white/70 border border-slate-100 p-4 rounded-3xl shadow-sm">
        <button 
          onClick={() => setModalType("export")}
          className="h-11 px-6 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition"
        >
          Export XLS
        </button>
        
        <form onSubmit={updateFilters} className="flex flex-col sm:flex-row gap-3 items-end w-full sm:w-auto">
          <div className="w-full sm:w-28">
            <label className="text-xs font-bold text-gray-500 uppercase">Tahun</label>
            <input type="number" name="year" defaultValue={currentParams.year} className="w-full h-11 px-4 mt-1 border rounded-xl" />
          </div>
          <div className="w-full sm:w-36">
            <label className="text-xs font-bold text-gray-500 uppercase">Status Final</label>
            <select name="status" defaultValue={currentParams.status} className="w-full h-11 px-4 mt-1 border rounded-xl">
              <option value="ALL">Semua</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="w-full sm:w-56">
            <label className="text-xs font-bold text-gray-500 uppercase">Cari</label>
            <input type="text" name="q" defaultValue={currentParams.q} placeholder="Nama, alasan..." className="w-full h-11 px-4 mt-1 border rounded-xl" />
          </div>
          <button type="submit" className="h-11 px-6 rounded-2xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition w-full sm:w-auto">
            Tampilkan
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Karyawan</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Waktu</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Durasi</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-center">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(r => {
                const finalSt = (r.status || "PENDING").toUpperCase();
                const mgrSt = (r.manager_status || "PENDING").toUpperCase();
                const canHcAction = finalSt === "PENDING";

                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{r.nama_karyawan}</div>
                      <div className="text-xs text-gray-500">{r.jabatan_karyawan} • {r.organisasi}</div>
                      <div className="text-[10px] text-gray-400 mt-1">ID #{r.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{formatDateTime(r.mulai_at)}</div>
                      <div className="text-xs text-gray-500">sampai {formatDateTime(r.selesai_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{Math.floor(r.durasi_menit / 60)}j {r.durasi_menit % 60}m</div>
                      <div className="text-xs text-gray-400">{r.durasi_menit} menit</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${badgeClass(mgrSt)}`}>M: {mgrSt}</span>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${badgeClass(finalSt)}`}>F: {finalSt}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-center">
                        <button onClick={() => { setSelectedLembur(r); setModalType("detail"); }} className="w-24 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700">Detail</button>
                        <button onClick={() => { setSelectedLembur(r); setModalType("edit"); }} className="w-24 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold">Edit</button>
                        <button disabled={!canHcAction} onClick={() => { setSelectedLembur(r); setModalType("approve"); }} className={`w-24 px-3 py-1 rounded-lg text-xs font-bold ${canHcAction ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>Approve</button>
                        <button onClick={() => { setSelectedLembur(r); setModalType("delete"); }} className="w-24 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold">Hapus</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Tidak ada data lembur.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {modalType === "export" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Export Riwayat Lembur</h3>
            <form action="/api/lembur/export" method="GET">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dari Tanggal</label>
                  <input type="date" name="start" value={exportStart} onChange={(e) => setExportStart(e.target.value)} className="w-full border p-2 rounded-xl" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
                  <input type="date" name="end" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)} className="w-full border p-2 rounded-xl" required />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold">Batal</button>
                <button type="submit" onClick={() => setTimeout(() => setModalType(null), 500)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold">Download</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modalType === "detail" && selectedLembur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Detail Lembur</h3>
              <button onClick={() => setModalType(null)} className="font-bold text-gray-500 hover:text-black">X</button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Karyawan</p>
                  <p className="font-bold">{selectedLembur.nama_karyawan}</p>
                  <p className="text-gray-500 text-xs">{selectedLembur.jabatan_karyawan} • {selectedLembur.organisasi}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Waktu</p>
                  <p className="font-bold">{formatDateTime(selectedLembur.mulai_at)}</p>
                  <p className="text-gray-500 text-xs">sampai {formatDateTime(selectedLembur.selesai_at)}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Status</p>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${badgeClass(selectedLembur.manager_status)}`}>Manager: {selectedLembur.manager_status || "PENDING"}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${badgeClass(selectedLembur.status)}`}>Final: {selectedLembur.status || "PENDING"}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Alasan</p>
                <p className="whitespace-pre-wrap">{selectedLembur.alasan || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Catatan Manager</p>
                  <p className="whitespace-pre-wrap text-gray-600">{selectedLembur.manager_notes || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Catatan HC</p>
                  <p className="whitespace-pre-wrap text-gray-600">{selectedLembur.notes || "-"}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setModalType(null)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && selectedLembur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-2">Edit Lembur</h3>
            <p className="text-xs text-gray-500 mb-6">{selectedLembur.nama_karyawan} • ID #{selectedLembur.id}</p>
            
            <form action={(f) => handleAction(editLembur, f)}>
              <input type="hidden" name="id" value={selectedLembur.id} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mulai</label>
                  <input type="datetime-local" name="mulai_at" defaultValue={formatLocalInput(selectedLembur.mulai_at)} className="w-full border p-2 rounded-xl" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selesai</label>
                  <input type="datetime-local" name="selesai_at" defaultValue={formatLocalInput(selectedLembur.selesai_at)} className="w-full border p-2 rounded-xl" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Durasi (Menit)</label>
                  <input type="number" name="durasi_menit" defaultValue={selectedLembur.durasi_menit} min="1" className="w-full border p-2 rounded-xl" placeholder="Kosongkan untuk auto hitung" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status Final (Opsional)</label>
                  <select name="status" defaultValue="" className="w-full border p-2 rounded-xl" onChange={(e) => {
                    const notesWrap = document.getElementById("editNotesWrap");
                    if (notesWrap) {
                      if (e.target.value === "REJECTED") notesWrap.classList.remove("hidden");
                      else notesWrap.classList.add("hidden");
                    }
                  }}>
                    <option value="">(Jangan Ubah)</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alasan</label>
                <textarea name="alasan" defaultValue={selectedLembur.alasan} rows={3} className="w-full border p-2 rounded-xl" required></textarea>
              </div>

              <div id="editNotesWrap" className="hidden mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan HC</label>
                <input type="text" name="notes" defaultValue={selectedLembur.notes || ""} className="w-full border p-2 rounded-xl" />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalType(null)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {modalType === "approve" && selectedLembur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-lg mb-4">Approval HC</h3>
            <div className="bg-gray-50 p-4 rounded-xl border mb-4">
              <p className="text-xs text-gray-500 font-bold uppercase">Karyawan</p>
              <p className="font-bold">{selectedLembur.nama_karyawan}</p>
              <p className="text-xs text-gray-500">{selectedLembur.jabatan_karyawan}</p>
            </div>

            <form action={(f) => handleAction(approveRejectLembur, f)}>
              <input type="hidden" name="id" value={selectedLembur.id} />
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan HC (wajib jika reject)</label>
                <input type="text" name="hc_notes" id="hcNotesInput" className="w-full border p-2 rounded-xl" placeholder="Tulis catatan..." />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalType(null)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">Batal</button>
                <button type="submit" name="hc_action" value="reject" onClick={(e) => {
                  const val = (document.getElementById("hcNotesInput") as HTMLInputElement)?.value;
                  if (!val.trim()) {
                    e.preventDefault();
                    alert("Catatan wajib diisi jika Reject.");
                  }
                }} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold">Reject</button>
                <button type="submit" name="hc_action" value="approve" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">Approve</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedLembur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4 text-rose-600">Hapus Data Lembur</h3>
            <p className="text-sm mb-4">Anda yakin ingin menghapus data lembur untuk <b>{selectedLembur.nama_karyawan}</b> pada tanggal {formatDateTime(selectedLembur.mulai_at)}?</p>
            <p className="text-xs text-rose-500 mb-6 font-bold">Aksi ini tidak dapat dibatalkan!</p>
            
            <form action={(f) => handleAction(deleteLembur, f)} className="flex justify-end gap-2">
              <input type="hidden" name="id" value={selectedLembur.id} />
              <button type="button" onClick={() => setModalType(null)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">Batal</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold disabled:opacity-50">Ya, Hapus</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

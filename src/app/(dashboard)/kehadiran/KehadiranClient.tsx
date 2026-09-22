"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { editKehadiran, toggleJenisJadwal } from "@/app/actions/kehadiran";
import { employeeFotoUrl } from "@/lib/employeePhoto";
import { useAlert } from "@/components/AlertProvider";

export default function KehadiranClient({
  listTetap,
  listStreamer,
  tanggalPilih,
  activeTab,
  tetapPicked
}: {
  listTetap: any[];
  listStreamer: any[];
  tanggalPilih: string;
  activeTab: string;
  tetapPicked: { masuk: string | null; pulang: string | null };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals state
  const [editModalData, setEditModalData] = useState<any>(null);
  const [detailModalData, setDetailModalData] = useState<any>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Export form states
  const [exportRange, setExportRange] = useState("weekly");
  const [exportFilter, setExportFilter] = useState("all");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tanggal", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleToggleStreamer = (id: number, toStreamer: boolean) => {
    if (!confirm(toStreamer ? "Pindahkan ke Jadwal Streamer?" : "Pindahkan ke Jadwal Tetap?")) return;
    startTransition(async () => {
      const action = toStreamer ? 'add_streamer' : 'remove_streamer';
      const res = await toggleJenisJadwal(id, action);
      if (!res.success) showAlert(res.message, "error");
    });
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const jm = form.get("jam_masuk") as string;
    const jp = form.get("jam_pulang") as string;
    const cat = form.get("catatan") as string;

    startTransition(async () => {
      const res = await editKehadiran(editModalData.karyawan_id, editModalData.tanggal, jm, jp, cat);
      if (res.success) {
        setEditModalData(null);
      } else {
        showAlert(res.message, "error");
      }
    });
  };

  const fetchDetail = async (id: number, tanggal: string) => {
    setDetailModalData({ loading: true });
    try {
      const res = await fetch(`/api/kehadiran/log?karyawan_id=${id}&tanggal=${tanggal}`);
      const data = await res.json();
      if (data.ok) {
        setDetailModalData({ loading: false, data });
      } else {
        showAlert(data.msg, "error");
        setDetailModalData(null);
      }
    } catch (err) {
      showAlert("Error fetching detail", "error");
      setDetailModalData(null);
    }
  };

  const handleExportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let url = `/api/kehadiran/export?tab=${activeTab}&range=${exportRange}&filter=${exportFilter}&tanggal=${tanggalPilih}`;
    if (exportRange === 'custom') {
      url += `&start_date=${exportStart}&end_date=${exportEnd}`;
    }
    window.location.href = url;
    setIsExportModalOpen(false);
  };

  const currentList = activeTab === 'streamer' ? listStreamer : listTetap;

  return (
    <div className="animate-in fade-in duration-500 w-full flex flex-col gap-6 relative">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 px-6 py-5 flex items-start gap-4 transition-colors">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#6d28d9] to-[#8b5cf6] text-white grid place-items-center text-sm font-extrabold shadow-md shrink-0">
          <span className="material-symbols-outlined text-[24px]">fact_check</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">
                Jadwal & Kehadiran
              </div>
              <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                Pantau presensi harian karyawan. Export data absensi ke Excel.
              </div>
            </div>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold rounded-lg text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Date Picker */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-100 dark:border-slate-700 w-full sm:w-auto">
          <button 
            onClick={() => setTab("tetap")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'tetap' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Jadwal Tetap
          </button>
          <button 
            onClick={() => setTab("streamer")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'streamer' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Jadwal Streamer
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Pilih Tanggal:</label>
          <input 
            type="date" 
            value={tanggalPilih}
            onChange={handleDateChange}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50 shadow-sm"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">
              Data Kehadiran {activeTab === 'tetap' ? 'Jadwal Tetap' : 'Jadwal Streamer'}
            </div>
            {activeTab === 'tetap' && (
               <div className="text-xs font-bold mt-1 text-slate-500 dark:text-slate-400">
                 Jam Kerja Hari Ini: {tetapPicked.masuk ? `${tetapPicked.masuk.substring(0,5)} - ${tetapPicked.pulang?.substring(0,5)}` : 'Libur'}
               </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 w-12">#</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Karyawan</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Jam Masuk</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Jam Pulang</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Status & Catatan</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right border-b border-slate-100 dark:border-slate-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">Tidak ada data karyawan di jadwal ini.</td>
                </tr>
              ) : (
                currentList.map((k, idx) => {
                  const jm = k.jam_masuk ? k.jam_masuk.substring(0,5) : '';
                  const jp = k.jam_pulang ? k.jam_pulang.substring(0,5) : '';
                  let status = k.status_absen || (jm ? 'Hadir' : 'Belum Absen');
                  let isLate = status.toLowerCase().includes('telat') || status.toLowerCase().includes('lambat');
                  
                  if (activeTab === 'tetap' && jm && tetapPicked.masuk && !isLate) {
                     if (`${jm}:00` > tetapPicked.masuk) isLate = true;
                  }

                  return (
                    <tr key={k.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>
                      <td className="px-5 py-4 align-top text-xs text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-4 align-top">
                         <div className="flex items-center gap-3">
                           {k.foto_url ? (
                             <img src={k.foto_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100" />
                           ) : (
                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm" style={{ backgroundColor: k.avatarBg }}>
                               {k.inisial}
                             </div>
                           )}
                           <div>
                             <div className="font-bold text-slate-800 dark:text-white text-[14px]">{k.nama}</div>
                             <div className="text-[12px] text-slate-500">{k.jabatan || k.organisasi || '-'}</div>
                           </div>
                         </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        {jm ? <span className="font-bold text-slate-700 dark:text-slate-300">{jm}</span> : <span className="text-slate-300 dark:text-slate-600">-</span>}
                        {k.foto_masuk && (
                          <div className="mt-1">
                            <a href={k.foto_masuk.startsWith('http') ? k.foto_masuk : `/api/legacy-files/${k.foto_masuk}`} target="_blank" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">photo_camera</span> Foto Masuk
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {jp ? <span className="font-bold text-slate-700 dark:text-slate-300">{jp}</span> : <span className="text-slate-300 dark:text-slate-600">-</span>}
                        {k.foto_pulang && (
                          <div className="mt-1">
                            <a href={k.foto_pulang.startsWith('http') ? k.foto_pulang : `/api/legacy-files/${k.foto_pulang}`} target="_blank" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">photo_camera</span> Foto Pulang
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                          isLate ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' : 
                          (status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-slate-100 text-slate-600 dark:bg-slate-800')
                        }`}>
                          {status}
                        </span>
                        {k.catatan && (
                          <div className="mt-2 text-[12px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <strong>Catatan:</strong> {k.catatan}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top text-right space-y-2">
                        <div className="flex items-center justify-end gap-2">
                          {k.presensi_id && (
                            <button 
                              onClick={() => setEditModalData({ karyawan_id: k.id, nama: k.nama, jam_masuk: jm, jam_pulang: jp, catatan: k.catatan || '', tanggal: tanggalPilih })}
                              className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors dark:bg-amber-500/10" title="Edit Absen"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                          )}
                          <button 
                            onClick={() => fetchDetail(k.id, tanggalPilih)}
                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors dark:bg-blue-500/10" title="Detail 30 Hari"
                          >
                            <span className="material-symbols-outlined text-[16px]">history</span>
                          </button>
                        </div>
                        <div>
                          {activeTab === 'tetap' ? (
                            <button onClick={() => handleToggleStreamer(k.id, true)} className="text-[11px] font-bold text-slate-400 hover:text-[#6d28d9] transition-colors">
                              Set as Streamer
                            </button>
                          ) : (
                            <button onClick={() => handleToggleStreamer(k.id, false)} className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors">
                              Remove Streamer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {mounted && editModalData && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditModalData(null)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Edit Kehadiran</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{editModalData.nama}</p>
              </div>
              <button onClick={() => setEditModalData(null)} className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-700 hover:bg-slate-300/50 text-slate-500 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">Jam Masuk</label>
                  <input type="time" name="jam_masuk" defaultValue={editModalData.jam_masuk} required className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#6d28d9]/50 focus:border-[#6d28d9] focus:outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">Jam Pulang</label>
                  <input type="time" name="jam_pulang" defaultValue={editModalData.jam_pulang} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#6d28d9]/50 focus:border-[#6d28d9] focus:outline-none transition-shadow" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">Catatan HRD</label>
                <textarea name="catatan" defaultValue={editModalData.catatan} placeholder="Tambahkan catatan khusus..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#6d28d9]/50 focus:border-[#6d28d9] focus:outline-none transition-shadow h-24 resize-none"></textarea>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setEditModalData(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Batal</button>
                <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#6d28d9] text-white hover:bg-[#5b21b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-violet-500/20">
                  {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Detail Modal (30 Days Log) */}
      {mounted && detailModalData && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetailModalData(null)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
            {detailModalData.loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                 <div className="w-10 h-10 border-4 border-[#6d28d9]/30 border-t-[#6d28d9] rounded-full animate-spin mb-4"></div>
                 <p className="font-bold">Memuat riwayat kehadiran...</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                     {detailModalData.data?.emp?.foto ? (
                       <img src={employeeFotoUrl(detailModalData.data.emp.foto)} alt="avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                     ) : (
                       <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 material-symbols-outlined">person</div>
                     )}
                     <div>
                       <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">{detailModalData.data?.emp?.nama}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Log Kehadiran: {detailModalData.data?.start} s.d {detailModalData.data?.end}</p>
                     </div>
                  </div>
                  <button onClick={() => setDetailModalData(null)} className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-700 hover:bg-slate-300/50 text-slate-500 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold w-24">Tanggal</th>
                        <th className="py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">Masuk</th>
                        <th className="py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">Pulang</th>
                        <th className="py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">Status & Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModalData.data?.rows?.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-400">Tidak ada riwayat kehadiran.</td></tr>
                      ) : (
                        detailModalData.data?.rows?.map((r: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="py-4 font-bold text-slate-700 dark:text-slate-300">{r.tanggal}</td>
                            <td className="py-4">
                              {r.jam_masuk ? <span className="font-bold text-slate-800 dark:text-white">{r.jam_masuk}</span> : '-'}
                              {r.foto_masuk && <div className="mt-1"><a href={r.foto_masuk.startsWith('http') ? r.foto_masuk : `/api/legacy-files/${r.foto_masuk}`} target="_blank" className="text-[11px] text-blue-500 flex items-center"><span className="material-symbols-outlined text-[12px] mr-1">image</span> Foto</a></div>}
                            </td>
                            <td className="py-4">
                              {r.jam_pulang ? <span className="font-bold text-slate-800 dark:text-white">{r.jam_pulang}</span> : '-'}
                              {r.foto_pulang && <div className="mt-1"><a href={r.foto_pulang.startsWith('http') ? r.foto_pulang : `/api/legacy-files/${r.foto_pulang}`} target="_blank" className="text-[11px] text-blue-500 flex items-center"><span className="material-symbols-outlined text-[12px] mr-1">image</span> Foto</a></div>}
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded text-[11px] font-bold ${r.status.toLowerCase().includes('telat') ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'}`}>{r.status}</span>
                              {r.catatan && <div className="mt-1 text-[12px] text-slate-500 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">"{r.catatan}"</div>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      , document.body)}

      {/* Export Modal */}
      {mounted && isExportModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExportModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
             <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2"><span className="material-symbols-outlined text-[#10b981]">description</span> Export Excel</h3>
                <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><span className="material-symbols-outlined">close</span></button>
             </div>
             <form onSubmit={handleExportSubmit} className="p-6">
                <div className="mb-4">
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Mode Rentang</label>
                  <select value={exportRange} onChange={(e) => setExportRange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981] outline-none">
                    <option value="weekly">Mingguan (Senin-Minggu ini)</option>
                    <option value="monthly">Bulanan (Bulan ini)</option>
                    <option value="custom">Pilih Tanggal Custom</option>
                  </select>
                </div>
                {exportRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                     <div>
                       <label className="block text-[11px] font-bold text-slate-500 mb-1">Dari Tanggal</label>
                       <input type="date" required value={exportStart} onChange={e=>setExportStart(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg text-sm" />
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold text-slate-500 mb-1">Sampai Tanggal</label>
                       <input type="date" required value={exportEnd} onChange={e=>setExportEnd(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg text-sm" />
                     </div>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">Filter Data</label>
                  <select value={exportFilter} onChange={(e) => setExportFilter(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981] outline-none">
                    <option value="all">Semua Data Kehadiran</option>
                    <option value="late">Hanya yang Terlambat Saja</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 rounded-xl font-bold bg-[#10b981] text-white hover:bg-[#059669] shadow-md shadow-emerald-500/20 transition-all flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">download</span> Unduh Excel
                </button>
             </form>
          </div>
        </div>
      , document.body)}

    </div>
  );
}

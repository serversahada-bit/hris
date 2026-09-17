"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { upsertMengajiBaca, upsertMengajiIzin } from "@/app/actions/mengaji";

type MengajiClientProps = {
  view: "ranking" | "daily";
  data: any[];
  orgs: string[];
  currentParams: {
    start: string;
    end: string;
    tanggal: string;
    org: string;
    q: string;
  };
};

export default function MengajiClient({ view, data, orgs, currentParams }: MengajiClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Modals state
  const [bacaModalOpen, setBacaModalOpen] = useState(false);
  const [izinModalOpen, setIzinModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Modal Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleExport = () => {
    let csv = "";
    if (view === "ranking") {
      csv += "Rank,Nama,Jabatan,Organisasi,Progress %,Halaman Final,Total Halaman,Total Sesi,Hari Mengaji,Hari Izin,Juz Terakhir,Tanggal Terakhir\n";
      data.forEach((r, idx) => {
        csv += `${idx + 1},"${r.nama || ''}","${r.jabatan || ''}","${r.organisasi || ''}","${r.progress_pct || 0}","${r.halaman_final || 0}","${r.total_lembar || 0}","${r.total_sesi || 0}","${r.hari_mengaji || 0}","${r.hari_izin || 0}","${r.juz_sekarang || ''}","${r.tgl_terakhir || ''}"\n`;
      });
    } else {
      csv += `Tanggal,Nama,Jabatan,Organisasi,Status,Sesi,Juz,Halaman Mulai,Halaman Selesai,Keterangan Mengaji,Jenis Izin,Keterangan Izin\n`;
      data.forEach(r => {
        const hasBaca = !!r.sesi_count;
        const isIzin = !!r.izin_id;
        let status = "KOSONG";
        if (hasBaca) status = "MENGAJI";
        else if (isIzin) status = "IZIN";

        csv += `"${currentParams.tanggal}","${r.nama || ''}","${r.jabatan || ''}","${r.organisasi || ''}","${status}","${r.sesi_count || ''}","${r.juz || ''}","${r.halaman_mulai || ''}","${r.halaman_selesai || ''}","${r.baca_keterangan || ''}","${r.izin_jenis || ''}","${r.izin_keterangan || ''}"\n`;
      });
    }
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mengaji_${view}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openBacaModal = (user: any) => {
    setSelectedUser(user);
    setBacaModalOpen(true);
  };

  const openIzinModal = (user: any) => {
    setSelectedUser(user);
    setIzinModalOpen(true);
  };

  const handleBacaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await upsertMengajiBaca(formData);
    setIsSubmitting(false);
    if (res.success) {
      setBacaModalOpen(false);
      alert(res.message);
    } else {
      alert(res.message || "Terjadi kesalahan.");
    }
  };

  const handleIzinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await upsertMengajiIzin(formData);
    setIsSubmitting(false);
    if (res.success) {
      setIzinModalOpen(false);
      alert(res.message);
    } else {
      alert(res.message || "Terjadi kesalahan.");
    }
  };

  return (
    <div>
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        
        {/* View Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => updateFilters("view", "ranking")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === "ranking" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Ranking
          </button>
          <button
            onClick={() => updateFilters("view", "daily")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === "daily" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Daily
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {view === "ranking" ? (
            <>
              <input 
                type="date" 
                value={currentParams.start} 
                onChange={(e) => updateFilters("start", e.target.value)}
                className="border rounded-md px-3 py-2 text-sm text-gray-700"
              />
              <span className="text-gray-400">s/d</span>
              <input 
                type="date" 
                value={currentParams.end} 
                onChange={(e) => updateFilters("end", e.target.value)}
                className="border rounded-md px-3 py-2 text-sm text-gray-700"
              />
            </>
          ) : (
            <input 
              type="date" 
              value={currentParams.tanggal} 
              onChange={(e) => updateFilters("tanggal", e.target.value)}
              className="border rounded-md px-3 py-2 text-sm text-gray-700"
            />
          )}

          <select 
            value={currentParams.org} 
            onChange={(e) => updateFilters("org", e.target.value)}
            className="border rounded-md px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Semua Organisasi</option>
            {orgs.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          
          <input 
            type="text"
            placeholder="Cari nama..."
            value={currentParams.q}
            onChange={(e) => updateFilters("q", e.target.value)}
            className="border rounded-md px-3 py-2 text-sm text-gray-700 w-40"
          />

          <button 
            onClick={handleExport}
            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {view === "ranking" ? (
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sesi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mengaji/Izin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Juz / Tgl Akhir</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Info Mengaji</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Info Izin</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              )}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  {view === "ranking" ? (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-700">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.nama}</div>
                        <div className="text-xs text-gray-500">{r.jabatan} • {r.organisasi}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-indigo-600">{Number(r.progress_pct).toFixed(1)}%</span>
                          <span className="text-xs text-gray-500">({r.total_lembar} lbr)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.total_sesi}x</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="text-emerald-600 font-medium">{r.hari_mengaji} hr</span> / <span className="text-amber-600 font-medium">{r.hari_izin} hr</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{r.juz_sekarang ? `Juz ${r.juz_sekarang}` : '-'}</div>
                        <div className="text-xs text-gray-500">{r.tgl_terakhir || '-'}</div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.nama}</div>
                        <div className="text-xs text-gray-500">{r.jabatan} • {r.organisasi}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.sesi_count > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            MENGAJI
                          </span>
                        ) : r.izin_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            IZIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            KOSONG
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {r.sesi_count > 0 ? (
                          <div>
                            <div className="font-medium text-indigo-600">Juz {r.juz} (Hal {r.halaman_mulai}-{r.halaman_selesai})</div>
                            <div className="text-xs text-gray-500">{r.sesi_count > 1 ? `${r.sesi_count} sesi, ` : ''}{r.baca_keterangan}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {r.izin_id ? (
                          <div>
                            <div className="font-medium text-amber-600">{r.izin_jenis}</div>
                            <div className="text-xs text-gray-500">{r.izin_keterangan}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openBacaModal(r)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-xs font-medium transition-colors">
                            {r.sesi_count > 0 ? "Edit Mengaji" : "+ Mengaji"}
                          </button>
                          <button onClick={() => openIzinModal(r)} className="text-amber-600 hover:text-amber-900 bg-amber-50 px-2 py-1 rounded text-xs font-medium transition-colors">
                            {r.izin_id ? "Edit Izin" : "+ Izin"}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Baca Modal */}
      {bacaModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {selectedUser?.sesi_count > 0 ? "Edit Sesi Terakhir Mengaji" : "Input Mengaji"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{selectedUser?.nama} - {currentParams.tanggal}</p>
            
            <form onSubmit={handleBacaSubmit}>
              <input type="hidden" name="baca_id" value={selectedUser?.baca_last_id || 0} />
              <input type="hidden" name="karyawan_id" value={selectedUser?.id} />
              <input type="hidden" name="tanggal" value={currentParams.tanggal} />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Juz</label>
                  <input type="number" name="juz" defaultValue={selectedUser?.juz || ''} required className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Halaman Mulai</label>
                    <input type="number" name="halaman_mulai" defaultValue={selectedUser?.halaman_mulai || ''} required className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Halaman Selesai</label>
                    <input type="number" name="halaman_selesai" defaultValue={selectedUser?.halaman_selesai || ''} required className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (Opsional)</label>
                  <input type="text" name="baca_keterangan" defaultValue={selectedUser?.baca_keterangan || ''} className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setBacaModalOpen(false)} className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Izin Modal */}
      {izinModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {selectedUser?.izin_id ? "Edit Izin" : "Input Izin"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{selectedUser?.nama} - {currentParams.tanggal}</p>
            
            <form onSubmit={handleIzinSubmit}>
              <input type="hidden" name="izin_id" value={selectedUser?.izin_id || 0} />
              <input type="hidden" name="karyawan_id" value={selectedUser?.id} />
              <input type="hidden" name="tanggal" value={currentParams.tanggal} />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Izin</label>
                  <select name="izin_jenis" defaultValue={selectedUser?.izin_jenis || 'SAKIT'} required className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="SAKIT">Sakit</option>
                    <option value="HAID">Haid</option>
                    <option value="DINAS">Dinas</option>
                    <option value="CUTI">Cuti</option>
                    <option value="LAIN">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (Opsional)</label>
                  <input type="text" name="izin_keterangan" defaultValue={selectedUser?.izin_keterangan || ''} className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIzinModalOpen(false)} className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
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

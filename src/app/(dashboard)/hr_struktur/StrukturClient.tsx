"use client";

import { useState, useTransition } from "react";
import { setAtasanLangsung } from "@/app/actions/struktur";

export default function StrukturClient({
  karyawanList,
  managerOptions
}: {
  karyawanList: any[];
  managerOptions: any[];
}) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<number | null>(null);

  // States for search and pagination (optional, but good for UX)
  const [searchTerm, setSearchTerm] = useState("");

  const filteredList = karyawanList.filter((k) => 
    k.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.organisasi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSimpan = (anggotaId: number, form: FormData) => {
    const managerId = Number(form.get("manager_id"));
    setActiveId(anggotaId);
    
    startTransition(async () => {
      const res = await setAtasanLangsung(anggotaId, managerId);
      if (res.success) {
        // Success animation or toast can go here
      } else {
        alert(res.message);
      }
      setActiveId(null);
    });
  };

  return (
    <div className="animate-in fade-in duration-500 w-full flex flex-col gap-6 relative">
      
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 px-6 py-5 flex items-start gap-4 transition-colors">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#3c50e0] to-[#5a6cf3] text-white grid place-items-center text-sm font-extrabold shadow-md shrink-0">
          SA
        </div>
        <div className="flex-1">
          <div className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">
            Struktur Atasan Langsung
          </div>
          <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Atur siapa atasan langsung setiap karyawan. Data ini dipakai untuk approval izin, cuti, dan lembur.
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="flex justify-end">
        <div className="relative">
           <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
           <input 
             type="text" 
             placeholder="Cari karyawan..." 
             className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#3c50e0] focus:ring-1 focus:ring-[#3c50e0]"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Tabel struktur */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">Daftar Struktur Tim</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pilih atasan langsung lalu klik Simpan per baris karyawan.</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 w-12">#</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Karyawan</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Organisasi</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Atasan Langsung</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Belum ada data karyawan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredList.map((k, idx) => (
                  <tr key={k.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    {/* No */}
                    <td className="px-5 py-4 align-top text-xs text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    {/* Karyawan */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-3 mb-1">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(k.nama)}&background=f1f5f9&color=475569`} className="w-8 h-8 rounded-full shadow-sm" alt="avatar" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-[14px]">{k.nama}</div>
                          {k.email_kerja && <div className="text-[12px] text-slate-500 dark:text-slate-400">{k.email_kerja}</div>}
                        </div>
                      </div>
                      <div className="text-[12px] text-slate-400 font-medium mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">ID {k.id}</span>
                        {k.posisi && <span>· {k.posisi}</span>}
                      </div>
                      {k.manager_nama && (
                        <div className="mt-2 text-[12px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">verified_user</span>
                          Atasan: <span className="font-bold">{k.manager_nama}</span>
                        </div>
                      )}
                    </td>

                    {/* Organisasi */}
                    <td className="px-5 py-4 align-top">
                      <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {k.organisasi || '-'}
                      </div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                        {k.jabatan || ''}
                      </div>
                    </td>

                    {/* Atasan selector */}
                    <td className="px-5 py-4 align-top">
                      <form action={(form) => handleSimpan(k.id, form)} className="flex items-start gap-2">
                        <select 
                          name="manager_id" 
                          defaultValue={k.manager_id || ""}
                          className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3c50e0] focus:border-[#3c50e0]"
                        >
                          <option value="">-- Tidak ada atasan --</option>
                          {managerOptions.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nama} {m.posisi ? `(${m.posisi})` : ''}
                            </option>
                          ))}
                        </select>
                        <button 
                          type="submit" 
                          disabled={isPending && activeId === k.id}
                          className="h-9 px-4 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#3c50e0] hover:text-white dark:hover:bg-[#3c50e0] text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                        >
                          {isPending && activeId === k.id ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            "Simpan"
                          )}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

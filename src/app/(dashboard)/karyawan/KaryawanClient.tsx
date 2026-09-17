"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tambahKaryawan, importKaryawanExcel } from "@/app/actions/karyawan";
import { Toast, useToast } from "@/components/Toast";

export default function KaryawanClient({ employees }: { employees: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, notify, close: closeToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  // Filter States
  const [filterDivisi, setFilterDivisi] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterKeaktifan, setFilterKeaktifan] = useState("Aktif"); // Default to Active only

  // Unique options for dropdowns
  const uniqueDivisi = Array.from(new Set(employees.map(e => e.organisasi).filter(Boolean)));
  const uniqueJabatan = Array.from(new Set(employees.map(e => e.jabatan).filter(Boolean)));
  const uniqueStatus = Array.from(new Set(employees.map(e => e.status_karyawan).filter(Boolean)));

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = emp.nama?.toLowerCase().includes(term) ||
                        emp.id_karyawan?.toLowerCase().includes(term) ||
                        emp.email?.toLowerCase().includes(term);

    const matchDivisi = filterDivisi ? emp.organisasi === filterDivisi : true;
    const matchJabatan = filterJabatan ? emp.jabatan === filterJabatan : true;
    const matchStatus = filterStatus ? emp.status_karyawan === filterStatus : true;
    const matchGender = filterGender ? emp.jenis_kelamin === filterGender : true;
    
    let matchKeaktifan = true;
    if (filterKeaktifan === "Aktif") {
      matchKeaktifan = emp.status_karyawan !== "Non-Aktif";
    } else if (filterKeaktifan === "Non-Aktif") {
      matchKeaktifan = emp.status_karyawan === "Non-Aktif";
    }

    return matchSearch && matchDivisi && matchJabatan && matchStatus && matchGender && matchKeaktifan;
  });

  const exportToXLS = () => {
    if (filteredEmployees.length === 0) {
      notify("Tidak ada data karyawan yang tampil untuk diekspor!", "error");
      return;
    }

    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"></head>
    <body>
      <table border="1">
        <thead>
          <tr>
            <th style="background-color: #3c50e0; color: white; height: 30px;">No</th>
            <th style="background-color: #3c50e0; color: white;">NIP</th>
            <th style="background-color: #3c50e0; color: white;">Nama Lengkap</th>
            <th style="background-color: #3c50e0; color: white;">Jenis Kelamin</th>
            <th style="background-color: #3c50e0; color: white;">Tempat Lahir</th>
            <th style="background-color: #3c50e0; color: white;">Tanggal Lahir</th>
            <th style="background-color: #3c50e0; color: white;">Email Kantor</th>
            <th style="background-color: #3c50e0; color: white;">No WhatsApp</th>
            <th style="background-color: #3c50e0; color: white;">Alamat</th>
            <th style="background-color: #3c50e0; color: white;">Jabatan</th>
            <th style="background-color: #3c50e0; color: white;">Divisi</th>
            <th style="background-color: #3c50e0; color: white;">Status Kepegawaian</th>
            <th style="background-color: #3c50e0; color: white;">Tanggal Bergabung</th>
          </tr>
        </thead>
        <tbody>`;

    filteredEmployees.forEach((row, index) => {
      tableHtml += `<tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="mso-number-format:'\\@'">${row.id_karyawan || '-'}</td>
        <td>${row.nama || '-'}</td>
        <td>${row.jenis_kelamin || '-'}</td>
        <td>${row.tempat_lahir || '-'}</td>
        <td>${row.tanggal_lahir || '-'}</td>
        <td>${row.email || '-'}</td>
        <td style="mso-number-format:'\\@'">${row.telp || '-'}</td>
        <td>${row.alamat || '-'}</td>
        <td>${row.jabatan || '-'}</td>
        <td>${row.organisasi || '-'}</td>
        <td>${row.status_karyawan || '-'}</td>
        <td>${row.tanggal_bergabung || '-'}</td>
      </tr>`;
    });

    tableHtml += `</tbody></table></body></html>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    a.href = url;
    a.download = `Data_Karyawan_${dateStr}.xls`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsImporting(true);
    setImportResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await importKaryawanExcel(formData);
    setIsImporting(false);

    notify(res.message, res.success ? "success" : "error");
    setImportResult({ inserted: res.inserted ?? 0, errors: res.errors ?? [] });

    if ((res.inserted ?? 0) > 0) {
      router.refresh();
    }
  };

  return (
    <div className="animate-in fade-in duration-500 text-slate-800 dark:text-slate-200">
      <Toast toast={toast} onClose={closeToast} />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Data Karyawan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Kelola informasi personal, kontak, dan kepegawaian seluruh tim.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-11 px-6 rounded bg-[#3c50e0] text-white font-medium hover:bg-blue-600 transition flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Karyawan
          </button>
          
          <div className="flex bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
            <button
              onClick={() => { setImportResult(null); setIsImportModalOpen(true); }}
              className="h-9 px-4 rounded text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Import
            </button>
            <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={exportToXLS}
              className="h-9 px-4 rounded text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2"
            >
              Ekspor <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-lg shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
        
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-[#3c50e0] dark:focus:border-blue-500 transition-colors dark:text-white"
            />
          </div>
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="h-10 px-4 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filter
            {(filterDivisi || filterJabatan || filterStatus || filterGender || filterKeaktifan) && (
              <span className="w-2 h-2 rounded-full bg-[#3c50e0] ml-1"></span>
            )}
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 text-[13px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Karyawan</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">NIP</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Divisi / Jabatan</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Join Date</th>
                <th className="py-4 px-6 text-center text-[13px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={emp.foto_url} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600" 
                          alt="avatar" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.nama)}&background=cbd5e1&color=fff`;
                          }}
                        />
                        <span 
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800"
                          style={{ backgroundColor: emp.avatarBg }}
                          title={emp.avatarBg === '#10b981' ? 'Hadir Hari Ini' : 'Belum Hadir'}
                        ></span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-[14px]">{emp.nama}</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{emp.email || '-'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{emp.id_karyawan}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{emp.organisasi || '-'}</p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">{emp.jabatan || '-'}</p>
                    </td>
                    <td className="py-4 px-6">
                      {emp.status_karyawan === 'Tetap' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[12px] font-semibold border border-emerald-200 dark:border-emerald-800/30">
                          {emp.status_karyawan}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[12px] font-semibold border border-indigo-200 dark:border-indigo-800/30">
                          {emp.status_karyawan || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-600 dark:text-slate-400">{emp.tanggal_bergabung || '-'}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link href={`/detail/${emp.id}`} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[#3c50e0] dark:hover:text-blue-400 transition inline-block" title="Edit Data">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 dark:text-slate-600">search_off</span>
                      <p className="font-medium">Data karyawan tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredEmployees.length}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{employees.length}</span> karyawan
          </p>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 rounded border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-400 cursor-not-allowed">
              Prev
            </button>
            <button className="h-8 px-3 rounded bg-[#3c50e0] text-white border border-[#3c50e0] text-sm font-medium shadow-sm">
              1
            </button>
            <button className="h-8 px-3 rounded border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Add Employee Modal */}
      {mounted && isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6" style={{ isolation: 'isolate' }}>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsAddModalOpen(false)}></div>
          
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-slate-700 overflow-hidden">
            
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">Tambah Karyawan Baru</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Lengkapi formulir di bawah ini untuk menambahkan data karyawan baru.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                disabled={isSubmitting}
                className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition focus:outline-none"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form action={async (formData) => {
              setIsSubmitting(true);
              const result = await tambahKaryawan(formData);
              if(result.success) {
                 notify(result.message, "success");
                 setIsAddModalOpen(false);
                 router.refresh();
              } else {
                 notify(result.message, "error");
              }
              setIsSubmitting(false);
            }} className="flex flex-col flex-1 overflow-hidden">
              
              <div className="p-8 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                  
                  {/* Photo Upload */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-5">Foto Profil</h4>
                    <div className="flex items-center gap-6">
                      <div className="h-24 w-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden shrink-0 shadow-inner bg-slate-50 dark:bg-slate-800">
                         <div className="h-full w-full flex items-center justify-center">
                           <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">person</span>
                         </div>
                      </div>
                      <div>
                        <input type="file" name="foto" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer dark:file:bg-violet-900/30 dark:file:text-violet-400 transition focus:outline-none" />
                        <p className="text-xs text-slate-400 mt-2 font-medium">Opsional. JPG, PNG, WEBP maksimal 2MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Identitas Diri */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-5">Identitas Diri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                        <input type="text" name="nama" required className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ID Karyawan (NIP)</label>
                        <input type="text" name="id_karyawan" required className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Jenis Kelamin</label>
                        <select name="jenis_kelamin" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tempat Lahir</label>
                        <input type="text" name="tempat_lahir" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Lahir</label>
                        <input type="date" name="tanggal_lahir" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status Pernikahan</label>
                        <select name="status_perkawinan" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="Belum Menikah">Belum Menikah</option>
                          <option value="Menikah">Menikah</option>
                          <option value="Cerai">Cerai</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Agama</label>
                        <select name="agama" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="">Pilih Agama</option>
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                          <option value="Konghucu">Konghucu</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Golongan Darah</label>
                        <select name="golongan_darah" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="">Pilih Golongan Darah</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                          <option value="Tidak Tahu">Tidak Tahu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kewarganegaraan</label>
                        <select name="warga" defaultValue="WNI" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="WNI">WNI</option>
                          <option value="WNA">WNA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pendidikan Terakhir</label>
                        <select name="pendidikan_terakhir" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="">Pilih Pendidikan</option>
                          <option value="SD">SD</option>
                          <option value="SMP">SMP</option>
                          <option value="SMA/SMK">SMA/SMK</option>
                          <option value="D3">D3</option>
                          <option value="S1">S1</option>
                          <option value="S2">S2</option>
                          <option value="S3">S3</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Kontak dan Dokumen */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-5">Kontak dan Dokumen</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                        <input type="email" name="email" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">No Handphone</label>
                        <input type="text" name="no_hp" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kontak Darurat</label>
                        <input type="text" name="kontak_darurat" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">NIK KTP</label>
                        <input type="text" name="id_kartu_identitas" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nomor KK</label>
                        <input type="text" name="nomor_kk" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">NPWP</label>
                        <input type="text" name="npwp" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Alamat KTP</label>
                        <textarea name="alamat_kartu_identitas" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm resize-none"></textarea>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Alamat Domisili</label>
                        <textarea name="alamat_domisili" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm resize-none"></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Pekerjaan */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-5">Pekerjaan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Jabatan</label>
                        <input type="text" name="jabatan" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Divisi / Organisasi</label>
                        <input type="text" name="organisasi" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status Kepegawaian</label>
                        <select name="status_karyawan" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="Tetap">Tetap</option>
                          <option value="Kontrak">Kontrak</option>
                          <option value="Probation">Probation</option>
                          <option value="Magang">Magang</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Bergabung</label>
                        <input type="date" name="tanggal_bergabung" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Berakhir (Kontrak)</label>
                        <input type="date" name="tanggal_masa_akhir_kerja" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Finansial & Asuransi */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-5">Finansial & Asuransi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Bank</label>
                        <input type="text" name="bank" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">BPJS Kesehatan</label>
                        <input type="text" name="bpjs_kesehatan" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">BPJS Ketenagakerjaan</label>
                        <input type="text" name="bpjs_ketenagakerjaan" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                    </div>
                  </div>

              </div>
              
              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
                <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="h-11 px-6 rounded-xl text-sm font-extrabold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm hover:shadow focus:outline-none">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="h-11 px-8 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 disabled:opacity-70 flex items-center gap-2 transition shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Import Modal */}
      {mounted && isImportModalOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6" style={{ isolation: 'isolate' }}>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isImporting && setIsImportModalOpen(false)}></div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-slate-700 overflow-hidden">

            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">Import Data Karyawan</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Unggah data karyawan sekaligus lewat file Excel.</p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                disabled={isImporting}
                className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition focus:outline-none"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto flex-1 space-y-5 custom-scrollbar">

                <a
                  href="/api/karyawan/import-template"
                  className="flex items-center gap-3 rounded-xl border border-violet-200 dark:border-violet-800/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Unduh Template Excel
                </a>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">File Excel (.xlsx)</label>
                  <input
                    type="file"
                    name="file"
                    accept=".xlsx"
                    required
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer dark:file:bg-violet-900/30 dark:file:text-violet-400 transition focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Isi data mulai dari baris ke-2 sesuai urutan kolom pada template. Maksimal 5MB.
                  </p>
                </div>

                {importResult && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {importResult.inserted} karyawan berhasil ditambahkan
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{importResult.errors.length} baris gagal:</p>
                        <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc pl-4 max-h-32 overflow-y-auto space-y-0.5">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
                <button type="button" onClick={() => setIsImportModalOpen(false)} disabled={isImporting} className="h-11 px-6 rounded-xl text-sm font-extrabold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm hover:shadow focus:outline-none">
                  Tutup
                </button>
                <button type="submit" disabled={isImporting} className="h-11 px-8 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 disabled:opacity-70 flex items-center gap-2 transition shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none">
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : "Proses Import"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFilterModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-[420px] max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-xl">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Filter Data</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Keaktifan</label>
                <select 
                  value={filterKeaktifan}
                  onChange={(e) => setFilterKeaktifan(e.target.value)}
                  className="w-full h-[42px] px-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#3c50e0] transition text-sm dark:text-white"
                >
                  <option value="">Tampilkan Semua</option>
                  <option value="Aktif">Hanya yang Aktif</option>
                  <option value="Non-Aktif">Hanya Non-Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Divisi</label>
                <select 
                  value={filterDivisi}
                  onChange={(e) => setFilterDivisi(e.target.value)}
                  className="w-full h-[42px] px-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#3c50e0] transition text-sm dark:text-white"
                >
                  <option value="">Semua Divisi</option>
                  {uniqueDivisi.map((div, i) => (
                    <option key={i} value={String(div)}>{String(div)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Jabatan</label>
                <select 
                  value={filterJabatan}
                  onChange={(e) => setFilterJabatan(e.target.value)}
                  className="w-full h-[42px] px-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#3c50e0] transition text-sm dark:text-white"
                >
                  <option value="">Semua Jabatan</option>
                  {uniqueJabatan.map((jab, i) => (
                    <option key={i} value={String(jab)}>{String(jab)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Status</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full h-[42px] px-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#3c50e0] transition text-sm dark:text-white"
                  >
                    <option value="">Semua</option>
                    {uniqueStatus.map((stat, i) => (
                      <option key={i} value={String(stat)}>{String(stat)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Gender</label>
                  <select 
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full h-[42px] px-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#3c50e0] transition text-sm dark:text-white"
                  >
                    <option value="">Semua</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="px-5 py-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center rounded-b-xl gap-3">
              <button 
                onClick={() => {
                  setFilterDivisi("");
                  setFilterJabatan("");
                  setFilterStatus("");
                  setFilterGender("");
                  setFilterKeaktifan("Aktif");
                }}
                className="h-11 px-5 rounded bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Reset
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="h-11 flex-1 rounded text-sm font-bold text-white bg-[#3c50e0] hover:bg-blue-600 transition shadow-sm"
              >
                Terapkan Filter
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfilKaryawan, updateAkunKaryawan } from "@/app/actions/karyawan";
import { employeeFotoUrl } from "@/lib/employeePhoto";

export default function DetailClient({ karyawan, riwayatKarir, presensi, izinCuti }: {
  karyawan: any;
  riwayatKarir: any[];
  presensi: any[];
  izinCuti: any[];
}) {
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  // Parse employee status to determine color
  const statusAktif = karyawan.status_karyawan === "Non-Aktif" ? false : true;

  // Helper to format dates
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "-") return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateProfilKaryawan(formData);
    setIsSubmitting(false);
    
    if (res.success) {
      alert(res.message);
      setIsEditModalOpen(false);
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  // Handle Password/Akun Submit
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingPassword(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", karyawan.id);
    const res = await updateAkunKaryawan(formData);
    setIsSavingPassword(false);

    alert(res.message);
    if (res.success) {
      e.currentTarget.reset();
      router.refresh();
    }
  };

  return (
    <>
      <div className="animate-in fade-in duration-500 text-slate-800 dark:text-slate-200 min-w-0">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Detail Karyawan</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Kelola informasi personal, kepegawaian, karir, serta log kehadiran.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold shadow-md hover:brightness-110 transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Data
            </button>
            <Link 
              href="/karyawan"
              className="h-11 px-6 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar Profile */}
        <aside className="col-span-1 lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700 shadow-sm p-6 text-center">
            
            <div className="relative inline-block">
              {karyawan.foto ? (
                <div className="h-24 w-24 rounded-full mx-auto overflow-hidden shadow-sm border-4 border-slate-100 dark:border-slate-700">
                  <img src={employeeFotoUrl(karyawan.foto)} className="h-full w-full object-cover" alt="Foto Karyawan" onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(karyawan.nama)}&background=cbd5e1&color=fff`;
                  }}/>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full flex items-center justify-center text-white font-extrabold text-3xl shadow-sm mx-auto border-4 border-slate-100 dark:border-slate-700"
                     style={{ background: karyawan.avatarBg }}>
                  {karyawan.inisial}
                </div>
              )}
            </div>

            <div className="mt-4">
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">{karyawan.nama || '-'}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{karyawan.jabatan || '-'}</p>
              <div className={`mt-3 inline-flex px-3 py-1 rounded-full text-xs font-bold border ${statusAktif ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/30'}`}>
                {karyawan.status_karyawan || '-'}
              </div>
            </div>

            <div className="mt-8 text-left space-y-1">
              {[
                { id: "personal", label: "Data Personal", icon: "person" },
                { id: "kepegawaian", label: "Kepegawaian", icon: "badge" },
                { id: "karir", label: "Riwayat Karir", icon: "trending_up" },
                { id: "password", label: "Password", icon: "lock" },
                { id: "kehadiran", label: "Log Harian", icon: "fact_check" },
                { id: "izin", label: "Izin dan Cuti", icon: "event_busy" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id 
                      ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 shadow-sm text-violet-600 dark:text-violet-400' : 'bg-transparent text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </aside>

        {/* Right Content */}
        <section className="col-span-1 lg:col-span-9">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700 shadow-sm p-6 sm:p-8 min-h-[500px]">
            
            {activeTab === "personal" && (
              <div className="animate-in fade-in duration-300 space-y-8">
                
                {/* Identitas Diri Section */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-violet-600 pl-3 mb-6">Identitas Diri</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-6">
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">ID Karyawan</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.id_karyawan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.nama || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Jenis Kelamin</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.jenis_kelamin || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Tempat Lahir</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.tempat_lahir || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Lahir</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatDate(karyawan.tanggal_lahir)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Agama</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.agama || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Golongan Darah</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.golongan_darah || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Status Perkawinan</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.status_perkawinan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Kewarganegaraan</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.warga || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Pendidikan Terakhir</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.pendidikan || '-'}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-700/50" />

                {/* Dokumen Sipil Section */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-violet-600 pl-3 mb-6">Dokumen Sipil</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-6">
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">NIK (KTP)</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.id_kartu_identitas || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nomor KK</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.nomor_kk || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">NPWP</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.npwp || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">File KTP</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {karyawan.file_ktp ? (
                          <a href={`/uploads/dokumen/${karyawan.file_ktp.split('/').pop()}`} target="_blank" className="text-violet-600 hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">visibility</span> Lihat KTP
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-700/50" />

                {/* Kontak dan Alamat Section */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-violet-600 pl-3 mb-6">Kontak & Alamat</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-6">
                    <div className="sm:col-span-2 md:col-span-1 lg:col-span-2 min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Email Pribadi</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 break-all">{karyawan.email || '-'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">No Handphone</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.no_hp || karyawan.telp || '-'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Kontak Darurat</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.kontak_darurat || '-'}</p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Alamat KTP</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.alamat_kartu_identitas || '-'}</p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Alamat Domisili</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.alamat_domisili || karyawan.alamat || '-'}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "kepegawaian" && (
              <div className="animate-in fade-in duration-300 space-y-8">
                
                {/* Informasi Pekerjaan */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-violet-600 pl-3 mb-6">Informasi Pekerjaan</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Jabatan</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.jabatan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Divisi / Organisasi</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.organisasi || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Status Kepegawaian</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusAktif ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                          {karyawan.status_karyawan || '-'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Bergabung</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatDate(karyawan.tanggal_bergabung)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Berakhir (Kontrak)</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatDate(karyawan.tanggal_masa_akhir_kerja)}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-700/50" />

                {/* Finansial & Asuransi */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-violet-600 pl-3 mb-6">Finansial & Asuransi</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nama Bank</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.bank || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">BPJS Kesehatan</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.bpjs_kesehatan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">BPJS Ketenagakerjaan</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{karyawan.bpjs_ketenagakerjaan || '-'}</p>
                    </div>
                  </div>
                </div>
                
              </div>
            )}

            {activeTab === "karir" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Karir</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">Promosi mutasi dan perubahan status.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm">
                      Update Karir
                    </button>
                    <button className="h-10 px-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition text-sm">
                      Berhentikan
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 font-bold">No</th>
                        <th className="px-6 py-3 font-bold">Tgl Efektif</th>
                        <th className="px-6 py-3 font-bold">Tipe</th>
                        <th className="px-6 py-3 font-bold">Divisi</th>
                        <th className="px-6 py-3 font-bold">Jabatan</th>
                        <th className="px-6 py-3 font-bold">Pangkat</th>
                        <th className="px-6 py-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {riwayatKarir.length > 0 ? riwayatKarir.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{formatDate(h.tanggal_efektif)}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">{h.jenis_perubahan || "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{h.organisasi || '-'}</td>
                          <td className="px-6 py-4 font-bold text-violet-700 dark:text-violet-400">{h.jabatan || '-'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{h.pangkat || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${h.status_karyawan==='Non-Aktif' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200'}`}>
                              {h.status_karyawan || '-'}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500">Belum ada riwayat karir.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Ubah Akun / Password</h3>
                
                <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 p-4 text-sm text-violet-900 dark:text-violet-300 font-semibold mb-6">
                  Tips: Password disimpan sebagai hash terenkripsi. Anda tidak bisa melihat password asli tapi bisa menggantinya. Username juga dapat diubah di sini.
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username (Akun Pengguna)</label>
                    <input type="text" name="nama_user" defaultValue={karyawan.nama_user || ''} required className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-violet-500 dark:text-white transition" placeholder="Masukkan username" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password Baru</label>
                    <input type="password" name="newPassword" placeholder="Minimal 6 karakter (kosongkan jika tidak diubah)" className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-violet-500 dark:text-white transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Password Baru</label>
                    <input type="password" name="confirmPassword" placeholder="Ulangi password baru" className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-violet-500 dark:text-white transition" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isSavingPassword} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition shadow-sm disabled:opacity-60">
                      {isSavingPassword ? "Menyimpan..." : "Simpan Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "kehadiran" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Log Harian</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">Riwayat kehadiran karyawan 30 hari terakhir.</p>
                  </div>
                  <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Total: <span className="text-slate-900 dark:text-white">{presensi.length}</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 font-bold">No</th>
                        <th className="px-6 py-3 font-bold">Tanggal</th>
                        <th className="px-6 py-3 font-bold">Masuk</th>
                        <th className="px-6 py-3 font-bold">Pulang</th>
                        <th className="px-6 py-3 font-bold">Status</th>
                        <th className="px-6 py-3 font-bold">Lokasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {presensi.length > 0 ? presensi.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{formatDate(a.tanggal)}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">{a.jam_masuk || "-"}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">{a.jam_pulang || "-"}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{a.status || "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                            <div>Masuk: {a.lokasi_masuk || "-"}</div>
                            <div>Pulang: {a.lokasi_pulang || "-"}</div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada data absen.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "izin" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Izin dan Cuti</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">Riwayat pengajuan izin, cuti, atau lembur.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 font-bold">No</th>
                        <th className="px-6 py-3 font-bold">Jenis</th>
                        <th className="px-6 py-3 font-bold">Mulai</th>
                        <th className="px-6 py-3 font-bold">Selesai</th>
                        <th className="px-6 py-3 font-bold">Status</th>
                        <th className="px-6 py-3 font-bold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {izinCuti.length > 0 ? izinCuti.map((x, i) => {
                        const jenis = x.jenis || x.jenis_izin || x.tipe || x.kategori || "-";
                        const mulai = x.tanggal_mulai || x.tgl_mulai || x.tanggal || "-";
                        const selesai = x.tanggal_selesai || x.tgl_selesai || x.tanggal_akhir || "-";
                        const status = x.status || x.status_pengajuan || x.status_cuti || "-";
                        const keterangan = x.alasan || x.keterangan || x.catatan || "-";
                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{jenis}</td>
                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{formatDate(mulai)}</td>
                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{formatDate(selesai)}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{status}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-400 max-w-xs truncate">{keterangan}</td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada pengajuan izin atau cuti.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
      </div>

      {/* Edit Employee Modal */}
      {mounted && isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6" style={{ isolation: 'isolate' }}>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsEditModalOpen(false)}></div>
          
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-slate-700 overflow-hidden">
            
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">Edit Data Karyawan</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Perbarui informasi detail untuk karyawan ini.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                disabled={isSubmitting}
                className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition focus:outline-none"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <input type="hidden" name="id" value={karyawan.id} />
              
              <div className="p-8 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                  
                  {/* Photo Upload */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-5">Foto Profil</h4>
                    <div className="flex items-center gap-6">
                      <div className="h-24 w-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden shrink-0 shadow-inner bg-slate-50 dark:bg-slate-800">
                        {karyawan.foto ? (
                           <img src={employeeFotoUrl(karyawan.foto)} className="h-full w-full object-cover" alt="Avatar"/>
                        ) : (
                           <div className="h-full w-full flex items-center justify-center">
                             <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">person</span>
                           </div>
                        )}
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
                        <input type="text" name="nama" defaultValue={karyawan.nama} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ID Karyawan (NIP)</label>
                        <input type="text" name="id_karyawan" defaultValue={karyawan.id_karyawan} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Jenis Kelamin</label>
                        <select name="jenis_kelamin" defaultValue={karyawan.jenis_kelamin} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tempat Lahir</label>
                        <input type="text" name="tempat_lahir" defaultValue={karyawan.tempat_lahir} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Lahir</label>
                        <input type="date" name="tanggal_lahir" defaultValue={karyawan.tanggal_lahir} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status Pernikahan</label>
                        <select name="status_perkawinan" defaultValue={karyawan.status_perkawinan} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="Belum Menikah">Belum Menikah</option>
                          <option value="Menikah">Menikah</option>
                          <option value="Cerai">Cerai</option>
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
                        <input type="email" name="email" defaultValue={karyawan.email} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">No Handphone</label>
                        <input type="text" name="no_hp" defaultValue={karyawan.no_hp || karyawan.telp} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">NIK KTP</label>
                        <input type="text" name="id_kartu_identitas" defaultValue={karyawan.id_kartu_identitas} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Pekerjaan */}
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-5">Pekerjaan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Jabatan</label>
                        <input type="text" name="jabatan" defaultValue={karyawan.jabatan} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Divisi / Organisasi</label>
                        <input type="text" name="organisasi" defaultValue={karyawan.organisasi} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status Kepegawaian</label>
                        <select name="status_karyawan" defaultValue={karyawan.status_karyawan} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm">
                          <option value="Tetap">Tetap</option>
                          <option value="Kontrak">Kontrak</option>
                          <option value="Probation">Probation</option>
                          <option value="Magang">Magang</option>
                          <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Bergabung</label>
                        <input type="date" name="tanggal_bergabung" defaultValue={karyawan.tanggal_bergabung} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Berakhir (Kontrak)</label>
                        <input type="date" name="tanggal_masa_akhir_kerja" defaultValue={karyawan.tanggal_masa_akhir_kerja} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition shadow-sm" />
                      </div>
                    </div>
                  </div>

                </div>
                
                <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting} className="h-11 px-6 rounded-xl text-sm font-extrabold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm hover:shadow focus:outline-none">
                    Batal
                  </button>
                  <button type="submit" disabled={isSubmitting} className="h-11 px-8 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 disabled:opacity-70 flex items-center gap-2 transition shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Menyimpan...
                      </>
                    ) : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

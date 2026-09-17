import db from "@/lib/db";
import {
  AttendanceChart,
  MengajiChart,
  StatusKerjaChart,
  GenderChart,
  IzinChart,
  LemburChart,
  DivisiChart,
} from "./DashboardCharts";

export const revalidate = 0; // Disable cache for dashboard

export default async function DashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const selectedDate = typeof searchParams.tanggal === "string" ? searchParams.tanggal : new Date().toISOString().split("T")[0];
  const today = selectedDate;

  // Formatting date
  const dateObj = new Date(selectedDate);
  const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const tgl = dateObj.getDate().toString().padStart(2, "0");
  const bln = bulanIndo[dateObj.getMonth()];
  const thn = dateObj.getFullYear();
  const selectedDateFormatted = `${bln} ${tgl}, ${thn}`;

  // Stat Defaults
  let totalKaryawan = 0;
  let hadirHariIni = 0;
  let terlambatHariIni = 0;
  let izinPending = 0;

  // Chart Defaults
  const chartDates: string[] = [];
  const chartHadir: number[] = [];
  const chartTerlambat: number[] = [];
  const chartMengaji: number[] = [];
  let statusKerjaLabels = ["Kontrak", "Tetap", "Probation"];
  let statusKerjaValues = [0, 0, 0];

  let topKaryawan: any[] = [];
  let topMengaji: any[] = [];
  let aktivitasTerbaru: any[] = [];

  let chartGenderLabels = ["Laki-laki", "Perempuan"];
  let chartGenderValues = [0, 0];
  let chartIzinLabels = ["Sakit", "Izin", "Cuti"];
  let chartIzinValues = [0, 0, 0];
  let chartLemburLabels = ["Pending", "Disetujui", "Ditolak"];
  let chartLemburValues = [0, 0, 0];
  let chartDivisiLabels = ["IT", "HRD", "Finance", "Marketing"];
  let chartDivisiValues = [0, 0, 0, 0];

  try {
    const [resKaryawan]: any = await db.query("SELECT COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif'");
    if (resKaryawan.length) totalKaryawan = resKaryawan[0].c;

    const [resHadir]: any = await db.query("SELECT COUNT(*) as c FROM presensi WHERE tanggal = ? AND status IN ('Hadir', 'Terlambat')", [today]);
    if (resHadir.length) hadirHariIni = resHadir[0].c;

    const [resTerlambat]: any = await db.query("SELECT COUNT(*) as c FROM presensi WHERE tanggal = ? AND status = 'Terlambat'", [today]);
    if (resTerlambat.length) terlambatHariIni = resTerlambat[0].c;

    const [resIzin]: any = await db.query("SELECT COUNT(*) as c FROM pengajuan_izin WHERE status = 'Pending'");
    if (resIzin.length) izinPending = resIzin[0].c;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dShort = `${d.getDate()} ${bulanIndo[d.getMonth()].slice(0, 3)}`;
      chartDates.push(dShort);

      const [resAtt]: any = await db.query(
        "SELECT SUM(CASE WHEN status IN ('Hadir','Terlambat') THEN 1 ELSE 0 END) as h, SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as t FROM presensi WHERE tanggal = ?",
        [ds]
      );
      chartHadir.push(Number(resAtt[0]?.h || 0));
      chartTerlambat.push(Number(resAtt[0]?.t || 0));

      const [resMengaji]: any = await db.query(
        "SELECT SUM((halaman_selesai - halaman_mulai) + 1) as c FROM mengaji_baca WHERE tanggal = ?",
        [ds]
      );
      chartMengaji.push(Number(resMengaji[0]?.c || 0));
    }
    chartDates.reverse();
    chartHadir.reverse();
    chartTerlambat.reverse();
    chartMengaji.reverse();

    const [resStatus]: any = await db.query("SELECT status_karyawan, COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif' GROUP BY status_karyawan");
    if (resStatus.length > 0) {
      statusKerjaLabels = resStatus.map((r: any) => r.status_karyawan || "Lainnya");
      statusKerjaValues = resStatus.map((r: any) => Number(r.c));
    }

    const m_start = `${thn}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-01`;
    const m_end = `${thn}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-31`;

    const [resTopKar]: any = await db.query(
      `SELECT k.id, k.nama, k.posisi, COUNT(a.id) as total_hadir 
       FROM karyawan k 
       JOIN presensi a ON k.id = a.karyawan_id 
       WHERE a.tanggal BETWEEN ? AND ? AND a.status = 'Hadir' AND k.status_karyawan != 'Non-Aktif'
       GROUP BY k.id 
       ORDER BY total_hadir DESC LIMIT 4`,
      [m_start, m_end]
    );
    topKaryawan = resTopKar;

    const [resTopMengaji]: any = await db.query(
      `SELECT k.id, k.nama, k.posisi, SUM((m.halaman_selesai - m.halaman_mulai) + 1) as total_halaman 
       FROM karyawan k 
       JOIN mengaji_baca m ON k.id = m.karyawan_id 
       WHERE m.tanggal BETWEEN ? AND ? AND k.status_karyawan != 'Non-Aktif'
       GROUP BY k.id 
       ORDER BY total_halaman DESC LIMIT 4`,
      [m_start, m_end]
    );
    topMengaji = resTopMengaji;

    const [resAktivitas]: any = await db.query(
      `SELECT k.id as karyawan_id, k.nama, k.posisi, a.jam_masuk, a.tanggal 
       FROM karyawan k 
       JOIN presensi a ON k.id = a.karyawan_id 
       WHERE a.status = 'Terlambat' AND a.jam_masuk IS NOT NULL AND k.status_karyawan != 'Non-Aktif'
       ORDER BY a.tanggal DESC, a.jam_masuk DESC LIMIT 5`
    );
    aktivitasTerbaru = resAktivitas;

    const [resGender]: any = await db.query("SELECT jenis_kelamin, COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif' GROUP BY jenis_kelamin");
    if (resGender.length > 0) {
      chartGenderLabels = resGender.map((r: any) => r.jenis_kelamin || "N/A");
      chartGenderValues = resGender.map((r: any) => Number(r.c));
    }

    try {
      const [resIzinType]: any = await db.query("SELECT jenis_izin as jenis, COUNT(*) as c FROM izin_cuti GROUP BY jenis_izin");
      if (resIzinType.length > 0) {
        chartIzinLabels = resIzinType.map((r: any) => r.jenis || "Lainnya");
        chartIzinValues = resIzinType.map((r: any) => Number(r.c));
      }
    } catch (e) {
      console.log("No izin_cuti table or jenis_izin column");
    }

    try {
      const [resLembur]: any = await db.query("SELECT status, COUNT(*) as c FROM pengajuan_lembur GROUP BY status");
      if (resLembur.length > 0) {
        chartLemburLabels = resLembur.map((r: any) => r.status || "Unknown");
        chartLemburValues = resLembur.map((r: any) => Number(r.c));
      }
    } catch (e) {
      console.log("No pengajuan_lembur table");
    }

    const [resDivisi]: any = await db.query("SELECT organisasi, COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif' GROUP BY organisasi");
    if (resDivisi.length > 0) {
      chartDivisiLabels = resDivisi.map((r: any) => r.organisasi || "Umum");
      chartDivisiValues = resDivisi.map((r: any) => Number(r.c));
    }

  } catch (err) {
    console.warn("Database tables missing or query failed. Displaying empty dashboard.", err);
  }

  const cardClass = "bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-lg shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col";

  return (
    <div className="animate-in fade-in duration-500 text-slate-800 dark:text-slate-200">
      
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        {/* Stat 1 */}
        <div className={cardClass}>
          <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-700/50 text-[#3c50e0] dark:text-blue-400 grid place-items-center mb-4">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Total Karyawan</h3>
            <div className="flex items-end justify-between">
              <p className="text-[28px] leading-none font-bold text-slate-800 dark:text-white">{totalKaryawan}</p>
              <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-500">
                100% <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className={cardClass}>
          <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-700/50 text-[#3c50e0] dark:text-blue-400 grid place-items-center mb-4">
            <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Hadir Hari Ini</h3>
            <div className="flex items-end justify-between">
              <p className="text-[28px] leading-none font-bold text-slate-800 dark:text-white">{hadirHariIni}</p>
              {totalKaryawan > 0 && (
                <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-500">
                  {Math.round((hadirHariIni / totalKaryawan) * 100)}% <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className={cardClass}>
          <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-700/50 text-[#3c50e0] dark:text-blue-400 grid place-items-center mb-4">
            <span className="material-symbols-outlined text-[24px]">event_busy</span>
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Izin Pending</h3>
            <div className="flex items-end justify-between">
              <p className="text-[28px] leading-none font-bold text-slate-800 dark:text-white">{izinPending}</p>
              {izinPending > 0 ? (
                <span className="flex items-center gap-1 text-[13px] font-medium text-rose-500">
                  Aksi <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-500">
                  Clear <span className="material-symbols-outlined text-[16px]">check</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className={cardClass}>
          <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-700/50 text-[#3c50e0] dark:text-blue-400 grid place-items-center mb-4">
            <span className="material-symbols-outlined text-[24px]">schedule</span>
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Terlambat</h3>
            <div className="flex items-end justify-between">
              <p className="text-[28px] leading-none font-bold text-slate-800 dark:text-white">{terlambatHariIni}</p>
              <span className="flex items-center gap-1 text-[13px] font-medium text-rose-500">
                Hari ini <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* BIG CHART (col-span-8) */}
        <div className={`${cardClass} lg:col-span-8`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Statistik Kehadiran</h3>
              <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium mt-1">Hadir vs Terlambat (7 Hari)</p>
            </div>
            
            <form className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1">
              <input
                type="date"
                name="tanggal"
                defaultValue={selectedDate}
                className="h-7 px-2 rounded-sm bg-transparent border-none text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-0 color-scheme-light dark:color-scheme-dark"
              />
              <button type="submit" className="h-7 px-3 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-[12px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm">
                Filter
              </button>
            </form>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="flex flex-col">
              <span className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3c50e0]"></span> Hadir
              </span>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#80caee]"></span> Terlambat
              </span>
            </div>
          </div>
          
          <div className="relative flex-1 w-full min-h-[300px]">
            <AttendanceChart dates={chartDates} hadir={chartHadir} terlambat={chartTerlambat} />
          </div>
        </div>

        {/* DOUGHNUT CHART (col-span-4) */}
        <div className={`${cardClass} lg:col-span-4`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Gender Target</h3>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">more_vert</span>
          </div>
          <div className="relative h-[250px] w-full flex-1 flex items-center justify-center">
            <GenderChart labels={chartGenderLabels} values={chartGenderValues} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{totalKaryawan}</span>
              <span className="text-[12px] text-slate-500 font-medium">Total</span>
            </div>
          </div>
          <div className="flex justify-between mt-6 px-4">
            <div className="text-center">
              <p className="text-[12px] text-slate-400 font-medium mb-1">Laki-laki</p>
              <p className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1">
                {chartGenderValues[0] || 0} <span className="text-emerald-500 text-[11px] font-medium flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_upward</span></span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[12px] text-slate-400 font-medium mb-1">Perempuan</p>
              <p className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1">
                {chartGenderValues[1] || 0} <span className="text-emerald-500 text-[11px] font-medium flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_upward</span></span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* LOWER ROW: Mengaji & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
        
        {/* Mengaji Chart */}
        <div className={`${cardClass} lg:col-span-4`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Target Mengaji</h3>
          <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 mb-6">Halaman selesai per hari</p>
          <div className="relative flex-1 w-full min-h-[220px]">
            <MengajiChart dates={chartDates} mengaji={chartMengaji} />
          </div>
        </div>

        {/* Top Karyawan Table */}
        <div className={`${cardClass} lg:col-span-8`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Aktivitas Terlambat Terbaru
            </h3>
            <span className="text-[12px] font-medium px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
              {selectedDateFormatted}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 text-[13px] font-semibold text-slate-800 dark:text-slate-300">Employee</th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-slate-800 dark:text-slate-300">Time</th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-slate-800 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {aktivitasTerbaru.length > 0 ? (
                  aktivitasTerbaru.map((aktivitas, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(aktivitas.nama)}&background=f1f5f9&color=475569`} className="w-10 h-10 rounded-full" alt="avatar" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-[14px]">{aktivitas.nama}</p>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{aktivitas.posisi || "-"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {String(aktivitas.jam_masuk).substring(0, 5)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {String(aktivitas.jam_masuk).substring(0, 5) > "08:00" ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 text-[12px] font-semibold">Late</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 text-[12px] font-semibold">On Time</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">No recent activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      {/* NEW ROW: Divisi, Status, and Rajin */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
        
        {/* Divisi Chart */}
        <div className={`${cardClass} lg:col-span-4`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Komposisi Divisi</h3>
          </div>
          <div className="relative flex-1 w-full min-h-[220px]">
             <DivisiChart labels={chartDivisiLabels} values={chartDivisiValues} />
          </div>
        </div>

        {/* Status Kerja Chart */}
        <div className={`${cardClass} lg:col-span-3`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Status Pekerja</h3>
          </div>
          <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-[180px]">
            <div className="relative h-[180px] w-full">
              <StatusKerjaChart labels={statusKerjaLabels} values={statusKerjaValues} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
            {statusKerjaLabels.map((lbl, i) => (
              <div key={i} className="flex flex-col items-center">
                 <span className="font-bold text-slate-800 dark:text-white">{statusKerjaValues[i] || 0}</span>
                 <span className="text-[11px] font-medium text-slate-400">{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Karyawan Rajin Table */}
        <div className={`${cardClass} lg:col-span-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Karyawan Terajin Bulan Ini</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="text-sm">
                {topKaryawan.length > 0 ? (
                  topKaryawan.map((karyawan, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-3 w-10">
                        {idx === 0 ? <span className="text-xl">🥇</span> : 
                         idx === 1 ? <span className="text-xl">🥈</span> : 
                         idx === 2 ? <span className="text-xl">🥉</span> : 
                         <span className="text-sm font-bold text-slate-400 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">{idx + 1}</span>}
                      </td>
                      <td className="py-3 px-2 flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(karyawan.nama)}&background=f8fafc&color=334155`} className="w-8 h-8 rounded-full shadow-sm" alt="avatar" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-[13px]">{karyawan.nama}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{karyawan.posisi || "-"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 text-[12px] font-bold rounded">
                          {karyawan.total_hadir} Kehadiran
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400 text-sm">Tidak ada data karyawan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

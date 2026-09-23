import { NextResponse } from 'next/server';
import db from '@/lib/db';

const getScheduleTetap = (ymd: string) => {
  const dt = new Date(ymd);
  const dow = dt.getDay(); // 0=Sun, 1=Mon...6=Sat
  if (dow >= 1 && dow <= 4) return { masuk: '08:00:00', pulang: '16:15:00' };
  if (dow === 5) return { masuk: '08:00:00', pulang: '16:00:00' };
  if (dow === 6) return { masuk: '08:00:00', pulang: '12:00:00' };
  return { masuk: null, pulang: null };
};

const dateRangeList = (start: Date, end: Date) => {
  const arr = [];
  let dt = new Date(start);
  while (dt <= end) {
    arr.push(dt.toISOString().split('T')[0]);
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
};

const getRangeDates = (tanggalPilih: string, range: string, customStart: string, customEnd: string) => {
  const refDate = new Date(tanggalPilih);
  let start = new Date(refDate);
  let end = new Date(refDate);

  if (range === 'custom') {
    start = customStart ? new Date(customStart) : refDate;
    end = customEnd ? new Date(customEnd) : refDate;
  } else if (range === 'monthly') {
    start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
  } else {
    // weekly (Monday to Sunday)
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(start.setDate(diff));
    end = new Date(start);
    end.setDate(end.getDate() + 6);
  }

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  return { 
    start: start.toISOString().split('T')[0], 
    end: end.toISOString().split('T')[0],
    dateList: dateRangeList(start, end)
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'tetap';
  const range = searchParams.get('range') || 'weekly';
  const filter = searchParams.get('filter') || 'all';
  const tanggal = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];
  const start_date = searchParams.get('start_date') || '';
  const end_date = searchParams.get('end_date') || '';

  const { start: expStart, end: expEnd, dateList } = getRangeDates(tanggal, range, start_date, end_date);

  const whereMode = tab === 'streamer' 
    ? "AND k.jenis_jadwal IN ('Shift Streamer','Shift TikTok','Shift Shopee')"
    : "AND (k.jenis_jadwal IS NULL OR k.jenis_jadwal='' OR k.jenis_jadwal='Tetap')";

  try {
    const sqlEmp = `
      SELECT k.id, k.nama, k.organisasi, k.jabatan, k.jenis_jadwal
      FROM karyawan k
      WHERE (k.status_karyawan IS NULL OR k.status_karyawan != 'Non-Aktif')
        ${whereMode}
      ORDER BY k.nama ASC
    `;
    const [employees]: any = await db.query(sqlEmp);
    
    let presensiMap: any = {};
    
    if (employees.length > 0) {
      const empIds = employees.map((e: any) => e.id);
      const placeholders = empIds.map(() => '?').join(',');
      
      const sqlP = `
        SELECT * FROM presensi 
        WHERE tanggal BETWEEN ? AND ? 
        AND karyawan_id IN (${placeholders})
      `;
      const [presensiRows]: any = await db.query(sqlP, [expStart, expEnd, ...empIds]);
      
      presensiRows.forEach((p: any) => {
        const t = (p.tanggal instanceof Date)
          ? `${p.tanggal.getFullYear()}-${String(p.tanggal.getMonth() + 1).padStart(2, '0')}-${String(p.tanggal.getDate()).padStart(2, '0')}`
          : String(p.tanggal);
        const k = Number(p.karyawan_id);
        if (!presensiMap[t]) presensiMap[t] = {};
        presensiMap[t][k] = p;
      });
    }

    const labelScope = tab === 'streamer' ? 'streamer' : 'tetap';
    const labelRange = range === 'monthly' ? 'bulanan' : (range === 'custom' ? 'custom' : 'mingguan');
    const labelFilter = filter === 'late' ? 'Hanya yang Terlambat' : 'Semua Data Kehadiran';
    const filename = `presensi_${labelScope}_${labelRange}_${expStart}_${expEnd}.xls`;
    const title1 = `Data Presensi (Dipisah Per Hari), ${expStart} s.d ${expEnd}`;
    const SITE_BASE = 'https://great.ptslu.id/';

    let html = `<html><head><meta charset='UTF-8'></head><body>`;
    html += `<table border='0' cellpadding='4' cellspacing='0'>
      <tr><td colspan='30' style='font-weight:bold; font-size:16px;'>${title1}</td></tr>
      <tr><td colspan='30' style='font-weight:bold;'>PT Sahada Laku Utama</td></tr>
      <tr><td colspan='30' style='color:#64748b; font-weight:bold;'>Scope: ${tab === 'streamer' ? 'Jadwal Streamer' : 'Jadwal Tetap'} • Mode: ${labelRange}</td></tr>
      <tr><td colspan='30' style='color:#64748b; font-weight:bold;'>Filter: ${labelFilter}</td></tr>
    </table>`;

    dateList.forEach(tgl => {
      const dt = new Date(tgl);
      const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const monthsIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      const tglHuman = `${daysIndo[dt.getDay()]}, ${dt.getDate()} ${monthsIndo[dt.getMonth()]} ${dt.getFullYear()}`;

      html += `<table border='0' cellpadding='4' cellspacing='0' style='margin-top:14px;'>
        <tr><td colspan='30' style='font-weight:bold; font-size:14px;'>${tglHuman} (${tgl})</td></tr>`;
      
      if (tab === 'tetap') {
        const sched = getScheduleTetap(tgl);
        const jmS = sched.masuk ? sched.masuk.substring(0,5) : 'Libur';
        const jpS = sched.pulang ? sched.pulang.substring(0,5) : '';
        const schedShow = (sched.masuk && sched.pulang) ? `${jmS} - ${jpS}` : 'Libur';
        html += `<tr><td colspan='30' style='color:#64748b; font-weight:bold;'>Jadwal Tetap: ${schedShow}</td></tr>`;
      }
      html += `</table>`;

      html += `<table border='1' cellpadding='5' cellspacing='0' style='border-collapse:collapse; margin-top:8px; width:100%;'>
        <tr style='background:#6d28d9; color:#ffffff; font-weight:bold;'>
          <td>No</td><td>Nama</td><td>Organisasi</td><td>Jabatan</td><td>Shift</td>
          <td>Masuk</td><td>Foto Masuk</td><td>Pulang</td><td>Foto Pulang</td>
          <td>Terlambat (Menit)</td><td>Status</td><td>Catatan</td>
        </tr>`;

      let no = 0;
      let hasRow = false;

      employees.forEach((k: any) => {
        const kid = Number(k.id);
        const p = presensiMap[tgl]?.[kid] || {};
        
        let shift = 'Jam Kantor';
        if (tab === 'streamer') {
          shift = k.jenis_jadwal || 'Shift Streamer';
        }

        const jm = p.jam_masuk ? String(p.jam_masuk).substring(0,5) : '';
        const jp = p.jam_pulang ? String(p.jam_pulang).substring(0,5) : '';
        const statusDb = p.status || '';
        const catatanDb = p.catatan || '';
        const foto_masuk = p.foto_masuk || '';
        const foto_pulang = p.foto_pulang || '';

        const status = statusDb || (jm ? 'Hadir' : 'Belum Absen');
        let isLate = false;
        let lateMinutes: number | null = null;

        if (statusDb.toLowerCase().includes('telat') || statusDb.toLowerCase().includes('lambat') || statusDb.toLowerCase().includes('late')) {
          isLate = true;
        }

        if (tab === 'tetap' && jm !== '') {
          const sched = getScheduleTetap(tgl);
          if (sched.masuk) {
            const jmFull = `${jm}:00`;
            if (jmFull > sched.masuk) {
              isLate = true;
              const dtSched = new Date(`${tgl}T${sched.masuk}`);
              const dtMasuk = new Date(`${tgl}T${jmFull}`);
              if (dtMasuk > dtSched) {
                lateMinutes = Math.floor((dtMasuk.getTime() - dtSched.getTime()) / 60000);
              }
            }
          }
        }

        if (filter === 'late' && !isLate) return;

        no++;
        hasRow = true;

        const fotoMasukCell = foto_masuk ? `<a href="${foto_masuk.startsWith('http') ? foto_masuk : SITE_BASE + foto_masuk}" target="_blank">Lihat</a>` : '';
        const fotoPulangCell = foto_pulang ? `<a href="${foto_pulang.startsWith('http') ? foto_pulang : SITE_BASE + foto_pulang}" target="_blank">Lihat</a>` : '';

        html += `<tr>
          <td>${no}</td>
          <td>${k.nama || ''}</td>
          <td>${k.organisasi || ''}</td>
          <td>${k.jabatan || ''}</td>
          <td>${shift}</td>
          <td>${jm}</td>
          <td>${fotoMasukCell}</td>
          <td>${jp}</td>
          <td>${fotoPulangCell}</td>
          <td>${lateMinutes !== null ? lateMinutes : '-'}</td>
          <td>${status}</td>
          <td>${catatanDb}</td>
        </tr>`;
      });

      if (!hasRow) {
        html += `<tr><td colspan='12' style='padding:8px; color:#64748b; font-weight:bold;'>Tidak ada data sesuai filter pada tanggal ini.</td></tr>`;
      }
      html += `</table><table border='0' cellpadding='2' cellspacing='0'><tr><td>&nbsp;</td></tr></table>`;
    });

    html += `</body></html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=UTF-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }
}

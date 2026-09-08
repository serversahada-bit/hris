import db from "@/lib/db";
import KehadiranClient from "./KehadiranClient";

export default async function KehadiranPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const tanggalPilih = typeof params.tanggal === "string" ? params.tanggal : new Date().toISOString().split("T")[0];
  const activeTab = typeof params.tab === "string" && params.tab === "streamer" ? "streamer" : "tetap";

  const colors = ['#c7d2fe', '#ddd6fe', '#e9d5ff', '#cbd5e1', '#a5b4fc', '#f5d0fe'];
  const EMP_UPLOAD_BASE_URL = 'https://great.ptslu.id/admin/uploads/';

  const getScheduleTetap = (ymd: string) => {
    const dt = new Date(ymd);
    const dow = dt.getDay(); // 0=Sun, 1=Mon...6=Sat
    if (dow >= 1 && dow <= 4) return { masuk: '08:00:00', pulang: '16:15:00' };
    if (dow === 5) return { masuk: '08:00:00', pulang: '16:00:00' };
    if (dow === 6) return { masuk: '08:00:00', pulang: '12:00:00' };
    return { masuk: null, pulang: null };
  };

  const tetapPicked = getScheduleTetap(tanggalPilih);

  const buildRows = async (mode: 'tetap' | 'streamer') => {
    const whereMode = mode === 'streamer' 
      ? "AND k.jenis_jadwal IN ('Shift Streamer','Shift TikTok','Shift Shopee')"
      : "AND (k.jenis_jadwal IS NULL OR k.jenis_jadwal='' OR k.jenis_jadwal='Tetap')";

    const sql = `
      SELECT
        k.id, k.nama, k.jabatan, k.organisasi, k.jenis_jadwal, k.foto,
        p.id AS presensi_id,
        p.jam_masuk,
        p.jam_pulang,
        p.foto_masuk,
        p.foto_pulang,
        p.status AS status_absen,
        p.catatan
      FROM karyawan k
      LEFT JOIN presensi p
        ON k.id = p.karyawan_id
       AND p.tanggal = ?
      WHERE (k.status_karyawan IS NULL OR k.status_karyawan != 'Non-Aktif')
      ${whereMode}
      ORDER BY k.nama ASC
    `;

    const [rows]: any = await db.query(sql, [tanggalPilih]);

    return rows.map((row: any) => {
      const nama = row.nama || '';
      const words = nama.trim().split(/\s+/).filter(Boolean);
      let inisial = '??';
      if (words.length >= 2) inisial = (words[0][0] + words[1][0]).toUpperCase();
      else if (words.length === 1) inisial = words[0].substring(0, 2).toUpperCase();

      const idInt = Number(row.id) || 0;
      const avatarBg = colors[idInt % colors.length];

      let foto = (row.foto || '').trim();
      if (foto.includes('/')) foto = foto.split('/').pop() || '';

      const foto_url = foto ? `${EMP_UPLOAD_BASE_URL.replace(/\/$/, '')}/${encodeURIComponent(foto)}` : '';

      return {
        ...row,
        inisial,
        avatarBg,
        foto,
        foto_url
      };
    });
  };

  const [listTetap, listStreamer] = await Promise.all([
    buildRows('tetap'),
    buildRows('streamer')
  ]);

  return (
    <KehadiranClient 
      listTetap={listTetap} 
      listStreamer={listStreamer}
      tanggalPilih={tanggalPilih}
      activeTab={activeTab}
      tetapPicked={tetapPicked}
    />
  );
}

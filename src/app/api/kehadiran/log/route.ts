import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const karyawanId = parseInt(searchParams.get('karyawan_id') || '0', 10);
  const tgl = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];

  if (karyawanId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    return NextResponse.json({ ok: false, msg: 'Input tidak valid.' }, { status: 400 });
  }

  const endDate = new Date(tgl);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);
  
  const end = endDate.toISOString().split('T')[0];
  const start = startDate.toISOString().split('T')[0];

  try {
    const [empRes]: any = await db.query(
      "SELECT id, nama, jabatan, organisasi, foto FROM karyawan WHERE id=? LIMIT 1",
      [karyawanId]
    );

    const emp = empRes.length > 0 ? empRes[0] : null;

    const [rows]: any = await db.query(`
      SELECT tanggal, jam_masuk, jam_pulang, foto_masuk, foto_pulang, status, catatan, lokasi_masuk, lokasi_pulang
      FROM presensi
      WHERE karyawan_id=? AND tanggal BETWEEN ? AND ?
      ORDER BY tanggal DESC
      LIMIT 60
    `, [karyawanId, start, end]);

    const formattedRows = rows.map((r: any) => ({
      tanggal: (r.tanggal instanceof Date) 
        ? `${r.tanggal.getFullYear()}-${String(r.tanggal.getMonth() + 1).padStart(2, '0')}-${String(r.tanggal.getDate()).padStart(2, '0')}`
        : String(r.tanggal),
      jam_masuk: r.jam_masuk ? String(r.jam_masuk).substring(0, 5) : '',
      jam_pulang: r.jam_pulang ? String(r.jam_pulang).substring(0, 5) : '',
      foto_masuk: String(r.foto_masuk || ''),
      foto_pulang: String(r.foto_pulang || ''),
      status: String(r.status || ''),
      catatan: String(r.catatan || ''),
      lokasi_masuk: String(r.lokasi_masuk || ''),
      lokasi_pulang: String(r.lokasi_pulang || '')
    }));

    return NextResponse.json({
      ok: true,
      emp,
      start,
      end,
      rows: formattedRows,
      site_base: 'https://great.ptslu.id/'
    });
  } catch (error) {
    console.error("Error API kehadiran log:", error);
    return NextResponse.json({ ok: false, msg: 'Database error' }, { status: 500 });
  }
}

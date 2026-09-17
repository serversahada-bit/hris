import db from "@/lib/db";
import DetailClient from "./DetailClient";

export const metadata = {
  title: "Detail Karyawan",
  description: "Lihat dan kelola detail karyawan",
};

export const revalidate = 0; // Disable cache

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let karyawan = null;
  let riwayatKarir = [];
  let presensi = [];
  let izinCuti = [];

  try {
    // 1. Fetch Profile
    const [karyawanRows]: any = await db.query(
      `SELECT * FROM karyawan WHERE id = ? LIMIT 1`,
      [id]
    );
    if (karyawanRows && karyawanRows.length > 0) {
      karyawan = karyawanRows[0];

      // Format initial & avatar background
      const nama = karyawan.nama ? String(karyawan.nama).trim() : '';
      const words = nama.split(/\s+/).filter(Boolean);
      let inisial = "NA";
      if (words.length >= 2) {
        inisial = (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
      } else if (words.length === 1) {
        inisial = words[0].substring(0, 2).toUpperCase();
      }
      karyawan.inisial = inisial;

      const colors = ['#c7d2fe', '#ddd6fe', '#e9d5ff', '#a5b4fc', '#f5d0fe', '#93c5fd'];
      karyawan.avatarBg = colors[Number(id) % colors.length];
    }

    // 2. Fetch Riwayat Karir
    try {
      const [karirRows]: any = await db.query(
        `SELECT * FROM riwayat_karir WHERE karyawan_id = ? ORDER BY tanggal_efektif DESC`,
        [id]
      );
      riwayatKarir = karirRows || [];
    } catch (e) {
      console.log("No riwayat_karir table");
    }

    // 3. Fetch Presensi (limit to last 30 for performance)
    try {
      const [presensiRows]: any = await db.query(
        `SELECT id, tanggal, jam_masuk, jam_pulang, lokasi_masuk, lokasi_pulang, foto_masuk, foto_pulang, status 
         FROM presensi WHERE karyawan_id = ? ORDER BY tanggal DESC, id DESC LIMIT 30`,
        [id]
      );
      presensi = presensiRows || [];
    } catch (e) {
      console.log("No presensi table");
    }

    // 4. Fetch Izin Cuti (Check which table exists)
    const izinTables = ['izin_cuti', 'pengajuan_cuti', 'cuti', 'izin'];
    for (const t of izinTables) {
      try {
        const [izinRows]: any = await db.query(
          `SELECT * FROM \`${t}\` WHERE karyawan_id = ? ORDER BY id DESC LIMIT 20`,
          [id]
        );
        izinCuti = izinRows || [];
        if (izinCuti.length > 0) break; // found data
      } catch (e) {
        // Continue to next table
      }
    }

  } catch (error) {
    console.error("Failed to fetch detail karyawan:", error);
  }

  if (!karyawan) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl mb-4 text-slate-300">error</span>
          <h2 className="text-xl font-bold text-slate-800">Karyawan Tidak Ditemukan</h2>
          <p className="mt-2 text-sm">ID: {id} tidak valid atau data telah dihapus.</p>
        </div>
      </div>
    );
  }

  return (
    <DetailClient 
      karyawan={JSON.parse(JSON.stringify(karyawan))} 
      riwayatKarir={JSON.parse(JSON.stringify(riwayatKarir))} 
      presensi={JSON.parse(JSON.stringify(presensi))} 
      izinCuti={JSON.parse(JSON.stringify(izinCuti))} 
    />
  );
}

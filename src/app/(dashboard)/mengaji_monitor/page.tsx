import db from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MengajiClient from "./MengajiClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MengajiMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("admin_id")?.value;

  // In the future, we can add manager check here using user_id if needed.
  if (!adminId) {
    redirect("/app");
  }

  const sp = await searchParams;
  
  const view = sp.view === "daily" ? "daily" : "ranking";
  const q = sp.q || "";
  const org = sp.org || "";

  // Helper for dates
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
  
  // Daily params
  const tanggal = sp.tanggal || todayStr;

  // Ranking params
  let start = sp.start;
  let end = sp.end || todayStr;
  
  if (!start) {
    // default to 1st of current month
    const d = new Date();
    d.setDate(1);
    start = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  }

  // Fetch Organizations for dropdown
  let orgs: string[] = [];
  try {
    const [orgRows]: any = await db.query(
      `SELECT DISTINCT organisasi FROM karyawan WHERE organisasi IS NOT NULL AND organisasi != '' ORDER BY organisasi ASC`
    );
    orgs = orgRows.map((r: any) => r.organisasi);
  } catch (e) {
    console.error("Failed to fetch organizations", e);
  }

  let tableData = [];

  try {
    if (view === "daily") {
      const params: any[] = [tanggal, tanggal];
      let orgCondition = "";
      let qCondition = "";
      
      if (org) {
        orgCondition = " AND k.organisasi = ? ";
        params.push(org);
      }
      
      if (q) {
        qCondition = " AND (k.nama LIKE ? OR k.jabatan LIKE ? OR k.organisasi LIKE ?) ";
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }

      const sql = `
        SELECT
          k.id, k.nama, k.jabatan, k.organisasi,
          mbAgg.sesi_count, mbAgg.juz_last AS juz, mbAgg.halaman_mulai_min AS halaman_mulai, mbAgg.halaman_selesai_max AS halaman_selesai,
          mbAgg.ket_last AS baca_keterangan, mbAgg.created_at_last AS baca_at, mbAgg.baca_last_id,
          mi.id AS izin_id, mi.jenis AS izin_jenis, mi.keterangan AS izin_keterangan
        FROM karyawan k
        LEFT JOIN (
          SELECT
            x.karyawan_id, COUNT(*) AS sesi_count, MIN(x.halaman_mulai) AS halaman_mulai_min, MAX(x.halaman_selesai) AS halaman_selesai_max,
            (SELECT mb2.juz FROM mengaji_baca mb2 WHERE mb2.karyawan_id = x.karyawan_id AND mb2.tanggal = x.tanggal ORDER BY mb2.created_at DESC, mb2.id DESC LIMIT 1) AS juz_last,
            (SELECT mb3.keterangan FROM mengaji_baca mb3 WHERE mb3.karyawan_id = x.karyawan_id AND mb3.tanggal = x.tanggal ORDER BY mb3.created_at DESC, mb3.id DESC LIMIT 1) AS ket_last,
            (SELECT mb4.created_at FROM mengaji_baca mb4 WHERE mb4.karyawan_id = x.karyawan_id AND mb4.tanggal = x.tanggal ORDER BY mb4.created_at DESC, mb4.id DESC LIMIT 1) AS created_at_last,
            (SELECT mb5.id FROM mengaji_baca mb5 WHERE mb5.karyawan_id = x.karyawan_id AND mb5.tanggal = x.tanggal ORDER BY mb5.created_at DESC, mb5.id DESC LIMIT 1) AS baca_last_id,
            x.tanggal
          FROM mengaji_baca x
          WHERE x.tanggal = ?
          GROUP BY x.karyawan_id, x.tanggal
        ) mbAgg ON mbAgg.karyawan_id = k.id
        LEFT JOIN mengaji_izin mi ON mi.karyawan_id = k.id AND mi.tanggal = ?
        WHERE 1=1 AND (k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)
        ${orgCondition}
        ${qCondition}
        ORDER BY
          CASE
            WHEN mbAgg.karyawan_id IS NOT NULL THEN 1
            WHEN mi.id IS NOT NULL THEN 2
            ELSE 3
          END ASC,
          k.nama ASC
        LIMIT 1200
      `;
      const [rows]: any = await db.query(sql, params);
      tableData = rows;
    } else {
      // Ranking view
      const QURAN_FINAL_PAGE = 604;
      const params: any[] = [
        QURAN_FINAL_PAGE, QURAN_FINAL_PAGE,
        start, end,
        start, end,
        start, end,
        start, end,
        start, end
      ];
      
      let orgCondition = "";
      let qCondition = "";
      
      if (org) {
        orgCondition = " AND k.organisasi = ? ";
        params.push(org);
      }
      
      if (q) {
        qCondition = " AND (k.nama LIKE ? OR k.jabatan LIKE ? OR k.organisasi LIKE ?) ";
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }

      const sql = `
        SELECT
          k.id, k.nama, k.jabatan, k.organisasi,
          COALESCE(m.total_sesi, 0) AS total_sesi,
          COALESCE(m.hari_mengaji, 0) AS hari_mengaji,
          COALESCE(i.hari_izin, 0) AS hari_izin,
          COALESCE(p.total_lembar, 0) AS total_lembar,
          COALESCE(p.halaman_final, 0) AS halaman_final,
          CASE WHEN ? <= 0 THEN 0 ELSE ROUND((COALESCE(p.total_lembar, 0) * 100.0) / ?, 1) END AS progress_pct,
          (SELECT mb2.juz FROM mengaji_baca mb2 WHERE mb2.karyawan_id = k.id AND mb2.tanggal BETWEEN ? AND ? ORDER BY mb2.tanggal DESC, mb2.created_at DESC, mb2.id DESC LIMIT 1) AS juz_sekarang,
          (SELECT DATE_FORMAT(mb3.tanggal, '%Y-%m-%d') FROM mengaji_baca mb3 WHERE mb3.karyawan_id = k.id AND mb3.tanggal BETWEEN ? AND ? ORDER BY mb3.tanggal DESC, mb3.created_at DESC, mb3.id DESC LIMIT 1) AS tgl_terakhir
        FROM karyawan k
        LEFT JOIN (
          SELECT karyawan_id, COUNT(*) AS total_sesi, COUNT(DISTINCT tanggal) AS hari_mengaji
          FROM mengaji_baca
          WHERE tanggal BETWEEN ? AND ?
          GROUP BY karyawan_id
        ) m ON m.karyawan_id = k.id
        LEFT JOIN (
          SELECT karyawan_id, COUNT(*) AS hari_izin
          FROM mengaji_izin
          WHERE tanggal BETWEEN ? AND ?
          GROUP BY karyawan_id
        ) i ON i.karyawan_id = k.id
        LEFT JOIN (
          SELECT karyawan_id, MAX(halaman_selesai) AS halaman_final,
            SUM(CASE WHEN halaman_mulai IS NOT NULL AND halaman_selesai IS NOT NULL THEN GREATEST(0, halaman_selesai - halaman_mulai + 1) ELSE 0 END) AS total_lembar
          FROM mengaji_baca
          WHERE tanggal BETWEEN ? AND ?
          GROUP BY karyawan_id
        ) p ON p.karyawan_id = k.id
        WHERE 1=1 AND (k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)
        ${orgCondition}
        ${qCondition}
        ORDER BY
          total_lembar DESC,
          hari_mengaji DESC,
          total_sesi DESC,
          halaman_final DESC,
          progress_pct DESC,
          tgl_terakhir DESC,
          juz_sekarang DESC,
          k.nama ASC
        LIMIT 1200
      `;
      const [rows]: any = await db.query(sql, params);
      tableData = rows;
    }
  } catch (error) {
    console.error("Database query failed", error);
  }

  // Convert Date objects to strings for serialization to Client Components if needed
  // mysql2 might return Date objects for some fields if they are DATE/DATETIME type.
  const serializedData = tableData.map((row: any) => {
    const newRow = { ...row };
    if (newRow.baca_at instanceof Date) {
      newRow.baca_at = newRow.baca_at.toISOString();
    }
    return newRow;
  });

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Monitoring Mengaji</h1>
      
      <MengajiClient 
        view={view}
        data={serializedData}
        orgs={orgs}
        currentParams={{ start, end, tanggal, org, q }}
      />
    </div>
  );
}

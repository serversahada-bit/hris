import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getExportPeriodLabel, getMonthName } from "@/app/(dashboard)/ranking/ranking-utils";

export const runtime = "nodejs";
export const revalidate = 0;

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidYmd(value: string | null) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeMonth(value: string | null) {
  const month = Number(value);
  if (Number.isInteger(month) && month >= 1 && month <= 12) {
    return String(month).padStart(2, "0");
  }

  return String(new Date().getMonth() + 1).padStart(2, "0");
}

function normalizeYear(value: string | null) {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 2000 && year <= 2100) {
    return String(year);
  }

  return String(new Date().getFullYear());
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const filterType = searchParams.get("filter_type") === "range" ? "range" : "month";

  let startDate = searchParams.get("start_date");
  let endDate = searchParams.get("end_date");
  const month = normalizeMonth(searchParams.get("month"));
  const year = normalizeYear(searchParams.get("year"));

  if (filterType === "range") {
    if (!isValidYmd(startDate)) {
      startDate = `${year}-${month}-01`;
    }
    if (!isValidYmd(endDate)) {
      endDate = `${year}-${month}-31`;
    }
    if (startDate! > endDate!) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }
  } else {
    startDate = `${year}-${month}-01`;
    const endDay = new Date(Number(year), Number(month), 0).getDate();
    endDate = `${year}-${month}-${String(endDay).padStart(2, "0")}`;
  }

  const whereInner = filterType === "range"
    ? "tanggal BETWEEN ? AND ?"
    : "YEAR(tanggal) = ? AND MONTH(tanggal) = ?";
  const whereOuter = filterType === "range"
    ? "p.tanggal BETWEEN ? AND ?"
    : "YEAR(p.tanggal) = ? AND MONTH(p.tanggal) = ?";

  const sqlExport = `
    SELECT 
      k.id, 
      k.nama, 
      k.jabatan,
      COUNT(p.id) AS total_hadir,
      SUM(CASE WHEN p.jam_masuk = p_min.min_jam AND p_min.min_jam IS NOT NULL THEN 1 ELSE 0 END) AS total_rank_1
    FROM karyawan k
    JOIN presensi p ON k.id = p.karyawan_id
    LEFT JOIN (
      SELECT tanggal, MIN(jam_masuk) AS min_jam
      FROM presensi
      WHERE ${whereInner}
        AND jam_masuk IS NOT NULL
        AND jam_masuk >= '07:00:00'
      GROUP BY tanggal
    ) p_min ON p.tanggal = p_min.tanggal
    WHERE ${whereOuter}
      AND (k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)
    GROUP BY k.id, k.nama, k.jabatan
    ORDER BY total_rank_1 DESC, total_hadir DESC, k.nama ASC
  `;

  const queryParams =
    filterType === "range"
      ? [startDate, endDate, startDate, endDate]
      : [year, month, year, month];

  let rows: Array<{
    nama: string | null;
    jabatan: string | null;
    total_hadir: number;
    total_rank_1: number;
  }> = [];

  try {
    const [result] = await db.query(sqlExport, queryParams);
    rows = result as typeof rows;
  } catch (error) {
    console.error("Export ranking query failed:", error);
    return new NextResponse("Export Query Error", { status: 500 });
  }

  const label = getExportPeriodLabel(filterType, month, year, startDate!, endDate!);
  const fileName =
    filterType === "range"
      ? `Rekap_Juara1_${startDate}_sd_${endDate}.xls`
      : `Rekap_Juara1_${getMonthName(Number(month))}_${year}.xls`;

  let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>";
  html += "<head><meta charset='UTF-8'></head><body>";
  html += "<table border='1'>";
  html += `
    <thead>
      <tr>
        <th colspan='5' style='background-color: #4f46e5; color: white; height: 30px; font-weight: bold;'>
          Rekap Juara 1 Kedatangan Paling Awal - ${escapeHtml(label)}
        </th>
      </tr>
      <tr>
        <th colspan='5' style='background-color: #f1f5f9; text-align: center; font-size: 11px; font-style: italic;'>
          *Hanya menghitung Juara 1 di atas jam 07:00 WIB (Shift Streamer Pagi tidak dihitung sbg juara)
        </th>
      </tr>
      <tr>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Peringkat</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Nama Karyawan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Jabatan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Total Kehadiran</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Total Mendapat Peringkat 1</th>
      </tr>
    </thead>
    <tbody>
  `;

  if (rows.length === 0) {
    html += "<tr><td colspan='5' style='text-align:center;'>Tidak ada data presensi pada periode tersebut.</td></tr>";
  } else {
    rows.forEach((row, index) => {
      html += `
        <tr>
          <td style='text-align: center;'>${index + 1}</td>
          <td>${escapeHtml(row.nama)}</td>
          <td>${escapeHtml(row.jabatan)}</td>
          <td style='text-align: center;'>${escapeHtml(row.total_hadir)} Hari</td>
          <td style='text-align: center; font-weight: bold;'>${escapeHtml(row.total_rank_1)} Kali</td>
        </tr>
      `;
    });
  }

  html += "</tbody></table></body></html>";

  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

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

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startRaw = searchParams.get("start") || "";
  const endRaw = searchParams.get("end") || "";

  let startSql: string;
  let endSql: string;
  let labelPeriode: string;
  let filename: string;

  if (startRaw && endRaw) {
    const startDate = new Date(startRaw);
    const endDate = new Date(endRaw);
    
    startSql = startDate.toISOString().split('T')[0] + " 00:00:00";
    endSql = endDate.toISOString().split('T')[0] + " 23:59:59";
    
    labelPeriode = `${startDate.toLocaleDateString("id-ID")} s.d ${endDate.toLocaleDateString("id-ID")}`;
    filename = `Rekap_Lembur_HC_${startRaw.replace(/-/g, "")}_sd_${endRaw.replace(/-/g, "")}.xls`;
  } else {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const mStr = m.toString().padStart(2, "0");
    const lastDay = new Date(y, m, 0).getDate();

    startSql = `${y}-${mStr}-01 00:00:00`;
    endSql = `${y}-${mStr}-${lastDay} 23:59:59`;

    const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    labelPeriode = `${months[m]} ${y}`;
    filename = `Rekap_Lembur_HC_${months[m]}_${y}.xls`;
  }

  let rows: any[] = [];
  try {
    const [result] = await db.query(
      `SELECT l.*, k.nama as nama_karyawan, k.jabatan 
       FROM lembur l 
       JOIN karyawan k ON l.karyawan_id = k.id
       WHERE l.mulai_at BETWEEN ? AND ?
       ORDER BY l.mulai_at ASC`,
      [startSql, endSql]
    );
    rows = result as any[];
  } catch (error) {
    console.error("Failed to export lembur data:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }

  let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>";
  html += "<head><meta charset='UTF-8'></head><body>";
  html += "<table border='1'>";
  html += `
    <thead>
      <tr>
        <th colspan='9' style='background-color: #4f46e5; color: white; height: 35px; font-weight: bold; font-size: 14px;'>
          Rekapitulasi Lembur Karyawan - Periode: ${escapeHtml(labelPeriode)}
        </th>
      </tr>
      <tr>
        <th style='background-color: #e0e7ff; font-weight: bold;'>No</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Nama Karyawan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Jabatan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Mulai Lembur</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Selesai Lembur</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Durasi (Menit)</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Alasan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Status Manager</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Status HC Final</th>
      </tr>
    </thead>
    <tbody>
  `;

  let no = 1;
  let totalMenit = 0;

  if (rows.length > 0) {
    rows.forEach((row) => {
      const status = String(row.status || "").toUpperCase();
      if (status === "APPROVED") {
        totalMenit += Number(row.durasi_menit) || 0;
      }

      const mulai = row.mulai_at ? new Date(row.mulai_at as string).toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':') : "";
      const selesai = row.selesai_at ? new Date(row.selesai_at as string).toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':') : "";

      html += `
        <tr>
          <td style='text-align: center;'>${no++}</td>
          <td>${escapeHtml(row.nama_karyawan)}</td>
          <td>${escapeHtml(row.jabatan)}</td>
          <td style='text-align: center; mso-number-format:"\\@";'>${escapeHtml(mulai)}</td>
          <td style='text-align: center; mso-number-format:"\\@";'>${escapeHtml(selesai)}</td>
          <td style='text-align: center;'>${escapeHtml(row.durasi_menit)} Menit</td>
          <td>${escapeHtml(row.alasan)}</td>
          <td style='text-align: center;'>${escapeHtml(String(row.manager_status || "PENDING").toUpperCase())}</td>
          <td style='text-align: center; font-weight: bold;'>${escapeHtml(status)}</td>
        </tr>
      `;
    });

    const jamTotal = Math.floor(totalMenit / 60);
    const menitSisa = totalMenit % 60;
    const totalStr = `${jamTotal} Jam ${menitSisa} Menit`;

    html += `
      <tr>
        <td colspan='5' style='text-align:right; font-weight:bold; background-color: #f8fafc;'>Total Waktu Lembur Keseluruhan (Hanya Status APPROVED):</td>
        <td colspan='4' style='font-weight:bold; background-color: #f8fafc; color: #15803d;'>${totalStr}</td>
      </tr>
    `;
  } else {
    html += "<tr><td colspan='9' style='text-align:center;'>Tidak ada data lembur pada periode ini.</td></tr>";
  }

  html += "</tbody></table></body></html>";

  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

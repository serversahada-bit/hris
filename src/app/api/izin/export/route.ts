import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const BUKTI_DIR_WEB = "https://great.ptslu.id/uploads/izin/";

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

function safeBasename(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\?.*$/, "").split("/").pop() || "";
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start_date") || new Date().toISOString().slice(0, 10).replace(/-\d{2}$/, "-01");
  const endDate = searchParams.get("end_date") || new Date().toISOString().slice(0, 10);

  let rows: Array<Record<string, unknown>> = [];
  try {
    const [result] = await db.query(
      `SELECT i.*, k.nama, k.jabatan
       FROM pengajuan_izin i
       LEFT JOIN karyawan k ON k.id = i.karyawan_id
       WHERE i.mulai_tanggal BETWEEN ? AND ?
         AND (k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)
       ORDER BY i.mulai_tanggal ASC, i.created_at ASC`,
      [startDate, endDate]
    );
    rows = result as Array<Record<string, unknown>>;
  } catch (error) {
    console.error("Failed to export izin data:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }

  const filename = `Rekap_Izin_Cuti_${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}.xls`;
  let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>";
  html += "<head><meta charset='UTF-8'></head><body>";
  html += "<table border='1'>";
  html += `
    <thead>
      <tr>
        <th colspan='10' style='background-color: #4f46e5; color: white; height: 35px; font-weight: bold; font-size: 14px;'>
          Rekapitulasi Izin & Cuti Karyawan - Periode: ${escapeHtml(startDate)} s/d ${escapeHtml(endDate)}
        </th>
      </tr>
      <tr>
        <th style='background-color: #e0e7ff; font-weight: bold;'>No</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Karyawan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Tipe Izin</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Mulai</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Sampai</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Alasan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Status Manager</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Status HC</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Tanggal Pengajuan</th>
        <th style='background-color: #e0e7ff; font-weight: bold;'>Link Bukti</th>
      </tr>
    </thead>
    <tbody>
  `;

  if (rows.length === 0) {
    html += "<tr><td colspan='10' style='text-align:center;'>Tidak ada data izin pada periode ini.</td></tr>";
  } else {
    rows.forEach((row, index) => {
      const nama = String(row.nama || `ID: ${row.karyawan_id || "-"}`);
      const fileBukti = safeBasename(row.bukti_foto as string | null);
      const linkBukti = fileBukti ? `${BUKTI_DIR_WEB}${encodeURIComponent(fileBukti)}` : "-";
      html += `
        <tr>
          <td style='text-align: center;'>${index + 1}</td>
          <td>${escapeHtml(nama)}</td>
          <td>${escapeHtml(row.tipe_izin as string | null)}</td>
          <td style='text-align: center;'>${escapeHtml(row.mulai_tanggal as string | null)}</td>
          <td style='text-align: center;'>${escapeHtml(row.sampai_tanggal as string | null)}</td>
          <td>${escapeHtml(row.alasan as string | null)}</td>
          <td style='text-align: center;'>${escapeHtml((row.manager_status as string | null) || "Pending")}</td>
          <td style='text-align: center;'>${escapeHtml((row.status as string | null) || "Pending")}</td>
          <td style='text-align: center;'>${escapeHtml(row.created_at ? String(row.created_at) : "-")}</td>
          <td>${linkBukti !== "-" ? `<a href='${escapeHtml(linkBukti)}' target='_blank'>Lihat File</a>` : "-"}</td>
        </tr>
      `;
    });
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

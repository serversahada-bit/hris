import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { KARYAWAN_IMPORT_FIELDS } from "@/lib/karyawanFields";

export async function GET() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Data Karyawan");

  ws.columns = KARYAWAN_IMPORT_FIELDS.map((f) => ({
    header: f.label,
    key: f.key,
    width: Math.max(f.label.length + 4, 18),
  }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3C50E0" } };
  });

  const exampleRow: Record<string, string> = {};
  KARYAWAN_IMPORT_FIELDS.forEach((f) => {
    exampleRow[f.key] = f.example || "";
  });
  ws.addRow(exampleRow);

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Template_Import_Karyawan.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}

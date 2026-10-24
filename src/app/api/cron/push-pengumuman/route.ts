import { NextRequest, NextResponse } from "next/server";
import { ensurePengumumanTable } from "@/lib/pengumumanDb";
import { kirimPushPengumumanPenting } from "@/lib/pengumumanPush";

// Dipanggil Scheduled Task Coolify tiap 5 menit, dengan header `Authorization: Bearer <CRON_SECRET>`.
// Mengirim push pengumuman penting yang tgl_notifikasi-nya (WIB) sudah tiba; aman dipanggil berulang.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET belum diset di server." }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensurePengumumanTable();
    const hasil = await kirimPushPengumumanPenting();
    return NextResponse.json({ success: true, hasil });
  } catch (error) {
    console.error("[Cron] Gagal memproses push pengumuman:", error);
    return NextResponse.json({ error: "Gagal memproses push pengumuman." }, { status: 500 });
  }
}

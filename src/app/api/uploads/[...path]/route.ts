import { NextRequest, NextResponse } from "next/server";
import { readLegacyFileLocal } from "@/lib/legacyUploads";

// Melayani file yang diunggah lewat app Great (foto profil, bukti izin, dst)
// yang sekarang disimpan di LEGACY_UPLOAD_DIR (folder persisten yang sama
// dipakai kedua app). Beda dengan /api/legacy-files: tidak ada remap prefix
// atau fallback ke great.ptslu.id, karena path baru sudah apa adanya.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  const relativePath = segments.join("/");
  const local = await readLegacyFileLocal(relativePath);
  if (!local) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(local.buffer, {
    headers: {
      "Content-Type": local.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

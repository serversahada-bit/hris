import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { PERATURAN_UPLOAD_DIR } from "@/lib/peraturanUploads";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  const filename = segments.join("/");
  if (filename.split("/").some((segment) => segment === "..")) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buffer = await readFile(path.join(PERATURAN_UPLOAD_DIR, filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

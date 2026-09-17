import { NextRequest, NextResponse } from "next/server";
import { readLegacyFileLocal, LEGACY_REMOTE_ORIGIN } from "@/lib/legacyUploads";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  const relativePath = segments.join("/");

  const local = await readLegacyFileLocal(relativePath);
  if (local) {
    return new NextResponse(local.buffer, {
      headers: {
        "Content-Type": local.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  try {
    const remoteUrl = `${LEGACY_REMOTE_ORIGIN}/${segments.map(encodeURIComponent).join("/")}`;
    const res = await fetch(remoteUrl);
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Failed to proxy legacy file:", error);
    return new NextResponse(null, { status: 502 });
  }
}

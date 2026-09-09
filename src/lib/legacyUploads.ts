import "server-only";
import { readFile } from "fs/promises";
import path from "path";

const BASE_DIR = process.env.LEGACY_UPLOAD_DIR || "/data/data_kantor/hrd/upload";
export const LEGACY_REMOTE_ORIGIN = "https://great.ptslu.id";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

// Nama folder fisik di disk (hasil cek File Manager) tidak selalu sama dengan
// segmen URL yang dipakai kode lama (great.ptslu.id). Daftar ini mencoba
// beberapa kemungkinan pemetaan sebelum menyerah ke fallback remote.
const PREFIX_REMAP: [string, string][] = [
  ["admin/uploads/", ""],
  ["uploads/izin/", "izin/"],
  ["uploads/presensi/", "presensi/"],
  ["absen/", "presensi/"],
];

function candidateRelativePaths(relativePath: string): string[] {
  const candidates = new Set<string>([relativePath]);
  for (const [from, to] of PREFIX_REMAP) {
    if (relativePath.startsWith(from)) {
      candidates.add(to + relativePath.slice(from.length));
    }
  }
  return Array.from(candidates);
}

function resolveSafe(relativePath: string): string | null {
  if (relativePath.split("/").some((segment) => segment === "..")) return null;
  const resolvedBase = path.resolve(BASE_DIR);
  const resolved = path.resolve(resolvedBase, relativePath);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolved;
}

export async function readLegacyFileLocal(relativePath: string) {
  for (const candidate of candidateRelativePaths(relativePath)) {
    const resolved = resolveSafe(candidate);
    if (!resolved) continue;
    try {
      const buffer = await readFile(resolved);
      const ext = path.extname(resolved).toLowerCase();
      return { buffer, contentType: MIME_TYPES[ext] || "application/octet-stream" };
    } catch {
      // coba kandidat berikutnya
    }
  }
  return null;
}

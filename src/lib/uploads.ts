import path from "path";
import crypto from "crypto";
import "server-only";

export const MAX_PDF_BYTES = 20 * 1024 * 1024;

const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

export function safeFilename(name: string) {
  let cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  cleaned = cleaned.replace(/_+/g, "_");
  cleaned = cleaned.replace(/^[._-]+|[._-]+$/g, "");
  return cleaned || `file_${Date.now()}`;
}

export function isPdfExtension(originalName: string) {
  return path.extname(originalName).toLowerCase() === ".pdf";
}

export function isPdfBuffer(buffer: Buffer) {
  return buffer.subarray(0, 5).equals(PDF_MAGIC);
}

export function stampedFilename(originalName: string, ext: string) {
  const base = safeFilename(path.basename(originalName, path.extname(originalName)));
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
  const random = crypto.randomBytes(3).toString("hex");
  return `${base}_${stamp}_${random}${ext}`;
}

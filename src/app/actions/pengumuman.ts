"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { safeFilename, stampedFilename } from "@/lib/uploads";

const UPLOAD_DIR_FS = path.join(process.cwd(), "public", "uploads", "pengumuman");
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function savePengumuman(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();

  if (!judul) return { error: "Judul wajib diisi." };
  if (!isi) return { error: "Isi pengumuman wajib diisi." };

  let newFileName: string | null = null;
  const file = formData.get("lampiran");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return { error: "Ukuran lampiran terlalu besar. Maks 10MB." };
    }
    const originalName = file.name || "lampiran";
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return { error: "Lampiran harus PDF, JPG, PNG, atau WEBP." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base = safeFilename(path.basename(originalName, ext));
    newFileName = stampedFilename(base + ext, ext);

    try {
      await mkdir(UPLOAD_DIR_FS, { recursive: true });
      await writeFile(path.join(UPLOAD_DIR_FS, newFileName), buffer);
    } catch (error) {
      console.error("Failed to save lampiran pengumuman:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Gagal simpan lampiran: ${message}` };
    }
  }

  try {
    if (id > 0) {
      let oldFile: string | null = null;
      if (newFileName) {
        const [rows] = await db.query("SELECT lampiran FROM pengumuman_hc WHERE id = ? LIMIT 1", [id]);
        const list = rows as { lampiran: string | null }[];
        oldFile = list[0]?.lampiran ?? null;
      }

      if (newFileName) {
        await db.query(
          "UPDATE pengumuman_hc SET judul=?, isi=?, lampiran=?, updated_at=NOW() WHERE id=?",
          [judul, isi, newFileName, id]
        );
        if (oldFile) {
          try {
            await unlink(path.join(UPLOAD_DIR_FS, oldFile));
          } catch {
            // ignore if already missing
          }
        }
      } else {
        await db.query(
          "UPDATE pengumuman_hc SET judul=?, isi=?, updated_at=NOW() WHERE id=?",
          [judul, isi, id]
        );
      }
    } else {
      await db.query(
        "INSERT INTO pengumuman_hc (judul, isi, lampiran, created_by) VALUES (?, ?, ?, ?)",
        [judul, isi, newFileName, adminId]
      );
    }

    revalidatePath("/pengumuman_hc");
    return { success: true };
  } catch (error) {
    console.error("Failed to save pengumuman:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan pengumuman: ${message}` };
  }
}

export async function deletePengumuman(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  if (!id || id <= 0) {
    return { error: "ID tidak valid." };
  }

  try {
    const [rows] = await db.query("SELECT lampiran FROM pengumuman_hc WHERE id = ? LIMIT 1", [id]);
    const list = rows as { lampiran: string | null }[];
    const file = list[0]?.lampiran;

    if (file) {
      try {
        await unlink(path.join(UPLOAD_DIR_FS, file));
      } catch {
        // ignore if already missing
      }
    }

    await db.query("DELETE FROM pengumuman_hc WHERE id = ?", [id]);

    revalidatePath("/pengumuman_hc");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete pengumuman:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus pengumuman: ${message}` };
  }
}

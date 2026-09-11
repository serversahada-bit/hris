"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { safeFilename, stampedFilename } from "@/lib/uploads";
import { generateKodeSistem } from "@/lib/asetUtils";
import { ensureRiwayatKeuanganTables } from "@/lib/asetDb";
import { ASET_UPLOAD_DIR } from "@/lib/asetUploads";

const UPLOAD_DIR_FS = ASET_UPLOAD_DIR;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function saveAset(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id") ?? 0);
  const namaAset = String(formData.get("nama_aset") ?? "").trim();
  const kodeAset = String(formData.get("kode_aset") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "").trim();
  const merk = String(formData.get("merk") ?? "").trim();
  const tipe = String(formData.get("tipe") ?? "").trim();
  const produsen = String(formData.get("produsen") ?? "").trim();
  const noSeri = String(formData.get("no_seri") ?? "").trim();
  const tahunProduksi = String(formData.get("tahun_produksi") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();
  const tokoDistributor = String(formData.get("toko_distributor") ?? "").trim();
  const noInvoice = String(formData.get("no_invoice") ?? "").trim();
  const tanggalPembelian = String(formData.get("tanggal_pembelian") ?? "").trim();
  const jumlah = Number(formData.get("jumlah") ?? 1);
  const hargaSatuan = Number(formData.get("harga_satuan") ?? 0);
  const umurEkonomisTahun = Number(formData.get("umur_ekonomis_tahun") ?? 1);
  const kondisi = String(formData.get("kondisi") ?? "").trim();
  const lokasi = String(formData.get("lokasi") ?? "").trim();
  const penanggungJawab = String(formData.get("penanggung_jawab") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();
  const intervalPerawatanRaw = String(formData.get("interval_perawatan_hari") ?? "").trim();
  const intervalPerawatanHari = intervalPerawatanRaw ? Number(intervalPerawatanRaw) : null;
  const tanggalPerawatanTerakhir = String(formData.get("tanggal_perawatan_terakhir") ?? "").trim();

  if (!namaAset) return { error: "Nama aset wajib diisi." };
  if (!kategori) return { error: "Kategori wajib dipilih." };
  if (!jumlah || jumlah <= 0) return { error: "Jumlah wajib diisi dan lebih dari 0." };
  if (hargaSatuan < 0) return { error: "Harga satuan tidak valid." };
  if (!umurEkonomisTahun || umurEkonomisTahun <= 0) return { error: "Umur ekonomis wajib diisi." };
  if (!kondisi) return { error: "Kondisi wajib dipilih." };
  if (intervalPerawatanRaw && (!intervalPerawatanHari || intervalPerawatanHari <= 0)) {
    return { error: "Interval perawatan tidak valid." };
  }

  let newFileName: string | null = null;
  const file = formData.get("foto");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return { error: "Ukuran foto terlalu besar. Maks 5MB." };
    }
    const originalName = file.name || "foto";
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return { error: "Foto harus JPG, PNG, GIF, atau WEBP." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base = safeFilename(path.basename(originalName, ext));
    newFileName = stampedFilename(base + ext, ext);

    try {
      await mkdir(UPLOAD_DIR_FS, { recursive: true });
      await writeFile(path.join(UPLOAD_DIR_FS, newFileName), buffer);
    } catch (error) {
      console.error("Failed to save foto aset:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Gagal simpan foto: ${message}` };
    }
  }

  const values = [
    namaAset,
    kodeAset || null,
    kategori,
    merk || null,
    tipe || null,
    produsen || null,
    noSeri || null,
    tahunProduksi || null,
    deskripsi || null,
    tokoDistributor || null,
    noInvoice || null,
    tanggalPembelian || null,
    jumlah,
    hargaSatuan,
    umurEkonomisTahun,
    kondisi,
    lokasi || null,
    penanggungJawab || null,
    catatan || null,
    intervalPerawatanHari,
    tanggalPerawatanTerakhir || null,
  ];

  try {
    if (id > 0) {
      let oldFile: string | null = null;
      if (newFileName) {
        const [rows] = await db.query("SELECT foto FROM aset_kantor WHERE id = ? LIMIT 1", [id]);
        const list = rows as { foto: string | null }[];
        oldFile = list[0]?.foto ?? null;
      }

      await db.query(
        `UPDATE aset_kantor
         SET nama_aset=?, kode_aset=?, kategori=?, merk=?, tipe=?, produsen=?, no_seri=?, tahun_produksi=?, deskripsi=?,
             toko_distributor=?, no_invoice=?, tanggal_pembelian=?, jumlah=?, harga_satuan=?, umur_ekonomis_tahun=?,
             kondisi=?, lokasi=?, penanggung_jawab=?, catatan=?, interval_perawatan_hari=?, tanggal_perawatan_terakhir=?
             ${newFileName ? ", foto=?" : ""}, updated_at=NOW()
         WHERE id=?`,
        newFileName ? [...values, newFileName, id] : [...values, id]
      );

      if (newFileName && oldFile) {
        try {
          await unlink(path.join(UPLOAD_DIR_FS, oldFile));
        } catch {
          // ignore if already missing
        }
      }
    } else {
      const kodeSistem = generateKodeSistem();
      await db.query(
        `INSERT INTO aset_kantor
         (kode_sistem, nama_aset, kode_aset, kategori, merk, tipe, produsen, no_seri, tahun_produksi, deskripsi,
          toko_distributor, no_invoice, tanggal_pembelian, jumlah, harga_satuan, umur_ekonomis_tahun,
          kondisi, lokasi, penanggung_jawab, catatan, interval_perawatan_hari, tanggal_perawatan_terakhir, foto, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [kodeSistem, ...values, newFileName, adminId]
      );
    }

    revalidatePath("/inventaris_hc");
    return { success: true };
  } catch (error) {
    console.error("Failed to save aset:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan data: ${message}` };
  }
}

export async function markAsetDirawat(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  if (!id || id <= 0) {
    return { error: "ID tidak valid." };
  }

  const tanggal = String(formData.get("tanggal") ?? "").trim();
  const nominal = Number(formData.get("nominal") ?? 0);
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  if (!tanggal) return { error: "Tanggal wajib diisi." };
  if (nominal < 0) return { error: "Nominal tidak valid." };

  try {
    await db.query("UPDATE aset_kantor SET tanggal_perawatan_terakhir = ?, updated_at = NOW() WHERE id = ?", [tanggal, id]);

    if (nominal > 0) {
      await ensureRiwayatKeuanganTables();
      await db.query(
        "INSERT INTO aset_keuangan (aset_id, tanggal, nominal, keterangan, created_by) VALUES (?, ?, ?, ?, ?)",
        [id, tanggal, nominal, keterangan || "Perawatan berkala", adminId]
      );
    }

    revalidatePath(`/inventaris_hc/${id}`);
    revalidatePath("/inventaris_hc");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark aset dirawat:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal memperbarui status perawatan: ${message}` };
  }
}

export async function deleteAset(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const id = Number(formData.get("id"));
  if (!id || id <= 0) {
    return { error: "ID tidak valid." };
  }

  try {
    const [rows] = await db.query("SELECT foto FROM aset_kantor WHERE id = ? LIMIT 1", [id]);
    const list = rows as { foto: string | null }[];
    const file = list[0]?.foto;

    if (file) {
      try {
        await unlink(path.join(UPLOAD_DIR_FS, file));
      } catch {
        // ignore if already missing
      }
    }

    await db.query("DELETE FROM aset_kantor WHERE id = ?", [id]);
    revalidatePath("/inventaris_hc");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete aset:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menghapus data: ${message}` };
  }
}

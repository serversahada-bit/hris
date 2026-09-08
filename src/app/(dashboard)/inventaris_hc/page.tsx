import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ensureAsetTable } from "@/lib/asetDb";
import InventarisClient from "./InventarisClient";

export const metadata = {
  title: "Inventaris Aset - Great HRD Workspace",
  description: "Data inventaris aset kantor beserta penyusutannya.",
};

export const revalidate = 0;

export type AsetRowRaw = {
  id: number;
  kode_sistem: string;
  nama_aset: string;
  kode_aset: string | null;
  kategori: string;
  merk: string | null;
  tipe: string | null;
  produsen: string | null;
  no_seri: string | null;
  tahun_produksi: string | null;
  deskripsi: string | null;
  toko_distributor: string | null;
  no_invoice: string | null;
  tanggal_pembelian: string | Date | null;
  jumlah: number;
  harga_satuan: string | number;
  umur_ekonomis_tahun: number;
  kondisi: string;
  lokasi: string | null;
  penanggung_jawab: string | null;
  catatan: string | null;
  foto: string | null;
  interval_perawatan_hari: number | null;
  tanggal_perawatan_terakhir: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date | null;
};

export type AsetItem = {
  id: number;
  kode_sistem: string;
  nama_aset: string;
  kode_aset: string | null;
  kategori: string;
  merk: string | null;
  tipe: string | null;
  produsen: string | null;
  no_seri: string | null;
  tahun_produksi: string | null;
  deskripsi: string | null;
  toko_distributor: string | null;
  no_invoice: string | null;
  tanggal_pembelian: string | null;
  jumlah: number;
  harga_satuan: number;
  umur_ekonomis_tahun: number;
  kondisi: string;
  lokasi: string | null;
  penanggung_jawab: string | null;
  catatan: string | null;
  foto: string | null;
  fotoUrl: string | null;
  interval_perawatan_hari: number | null;
  tanggal_perawatan_terakhir: string | null;
};

function toDateInputValue(value: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export default async function InventarisHcPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  let items: AsetItem[] = [];

  try {
    await ensureAsetTable();

    const [rows] = await db.query(
      `SELECT id, kode_sistem, nama_aset, kode_aset, kategori, merk, tipe, produsen, no_seri, tahun_produksi,
              deskripsi, toko_distributor, no_invoice, tanggal_pembelian, jumlah, harga_satuan,
              umur_ekonomis_tahun, kondisi, lokasi, penanggung_jawab, catatan, foto,
              interval_perawatan_hari, tanggal_perawatan_terakhir, created_at, updated_at
       FROM aset_kantor
       ORDER BY created_at DESC`
    );

    items = (rows as AsetRowRaw[]).map((row) => ({
      id: row.id,
      kode_sistem: row.kode_sistem,
      nama_aset: row.nama_aset,
      kode_aset: row.kode_aset,
      kategori: row.kategori,
      merk: row.merk,
      tipe: row.tipe,
      produsen: row.produsen,
      no_seri: row.no_seri,
      tahun_produksi: row.tahun_produksi,
      deskripsi: row.deskripsi,
      toko_distributor: row.toko_distributor,
      no_invoice: row.no_invoice,
      tanggal_pembelian: toDateInputValue(row.tanggal_pembelian),
      jumlah: row.jumlah,
      harga_satuan: Number(row.harga_satuan),
      umur_ekonomis_tahun: row.umur_ekonomis_tahun,
      kondisi: row.kondisi,
      lokasi: row.lokasi,
      penanggung_jawab: row.penanggung_jawab,
      catatan: row.catatan,
      foto: row.foto,
      fotoUrl: row.foto ? `/uploads/aset/${encodeURIComponent(row.foto)}` : null,
      interval_perawatan_hari: row.interval_perawatan_hari,
      tanggal_perawatan_terakhir: toDateInputValue(row.tanggal_perawatan_terakhir),
    }));
  } catch (error) {
    console.error("Failed to fetch aset kantor:", error);
  }

  return <InventarisClient items={items} />;
}

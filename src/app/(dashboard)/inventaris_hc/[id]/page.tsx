import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { generateQrDataUrl } from "@/lib/qr";
import { ensureAsetTable, ensureRiwayatKeuanganTables } from "@/lib/asetDb";
import type { AsetItem, AsetRowRaw } from "../page";
import AsetDetailClient from "./AsetDetailClient";

export const revalidate = 0;

export type RiwayatItem = {
  id: number;
  sejak_tanggal: string;
  penanggung_jawab: string;
  lokasi: string;
  jumlah: number;
  kondisi_persen: number;
  kelengkapan_persen: number;
  keterangan: string | null;
};

export type KeuanganItem = {
  id: number;
  tanggal: string;
  nominal: number;
  keterangan: string;
};

type RiwayatRowRaw = {
  id: number;
  sejak_tanggal: string | Date;
  penanggung_jawab: string;
  lokasi: string;
  jumlah: number;
  kondisi_persen: number;
  kelengkapan_persen: number;
  keterangan: string | null;
};

type KeuanganRowRaw = {
  id: number;
  tanggal: string | Date;
  nominal: string | number;
  keterangan: string;
};

function toDateInputValue(value: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export default async function AsetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || id <= 0) notFound();

  await ensureAsetTable();
  await ensureRiwayatKeuanganTables();

  const [rows] = await db.query(
    `SELECT id, kode_sistem, nama_aset, kode_aset, kategori, merk, tipe, produsen, no_seri, tahun_produksi,
            deskripsi, toko_distributor, no_invoice, tanggal_pembelian, jumlah, harga_satuan,
            umur_ekonomis_tahun, kondisi, lokasi, penanggung_jawab, catatan, foto,
            interval_perawatan_hari, tanggal_perawatan_terakhir, created_at, updated_at
     FROM aset_kantor WHERE id = ? LIMIT 1`,
    [id]
  );
  const list = rows as AsetRowRaw[];
  if (list.length === 0) notFound();

  const row = list[0];
  const item: AsetItem = {
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
  };

  const [riwayatRows] = await db.query(
    `SELECT id, sejak_tanggal, penanggung_jawab, lokasi, jumlah, kondisi_persen, kelengkapan_persen, keterangan
     FROM aset_riwayat WHERE aset_id = ? ORDER BY sejak_tanggal DESC, id DESC`,
    [id]
  );
  const riwayat: RiwayatItem[] = (riwayatRows as RiwayatRowRaw[]).map((r) => ({
    id: r.id,
    sejak_tanggal: toDateInputValue(r.sejak_tanggal) as string,
    penanggung_jawab: r.penanggung_jawab,
    lokasi: r.lokasi,
    jumlah: r.jumlah,
    kondisi_persen: r.kondisi_persen,
    kelengkapan_persen: r.kelengkapan_persen,
    keterangan: r.keterangan,
  }));

  const [keuanganRows] = await db.query(
    `SELECT id, tanggal, nominal, keterangan FROM aset_keuangan WHERE aset_id = ? ORDER BY tanggal DESC, id DESC`,
    [id]
  );
  const keuangan: KeuanganItem[] = (keuanganRows as KeuanganRowRaw[]).map((r) => ({
    id: r.id,
    tanggal: toDateInputValue(r.tanggal) as string,
    nominal: Number(r.nominal),
    keterangan: r.keterangan,
  }));

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const qrUrl = `${proto}://${host}/inventaris_hc/${id}`;
  const qrDataUrl = await generateQrDataUrl(qrUrl);

  return <AsetDetailClient item={item} riwayat={riwayat} keuangan={keuangan} qrDataUrl={qrDataUrl} qrUrl={qrUrl} />;
}

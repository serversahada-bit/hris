import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ensureKantorTable } from "@/lib/kantorDb";
import LokasiKantorClient from "./LokasiKantorClient";

export const metadata = {
  title: "Lokasi Kantor - Great HRD Workspace",
  description: "Titik lokasi kantor sebagai acuan jarak absen karyawan.",
};

export const revalidate = 0;

type KantorRow = {
  id: number;
  nama: string;
  alamat: string | null;
  latitude: string;
  longitude: string;
  radius_meter: number;
  is_aktif: number;
};

export type KantorItem = {
  id: number;
  nama: string;
  alamat: string;
  lat: number;
  lon: number;
  radius: number;
  isAktif: boolean;
};

export default async function LokasiKantorPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  let items: KantorItem[] = [];

  try {
    await ensureKantorTable();
    const [rows] = await db.query(
      "SELECT id, nama, alamat, latitude, longitude, radius_meter, is_aktif FROM kantor ORDER BY is_aktif DESC, nama ASC"
    );
    items = (rows as KantorRow[]).map((row) => ({
      id: row.id,
      nama: row.nama,
      alamat: row.alamat ?? "",
      lat: Number(row.latitude),
      lon: Number(row.longitude),
      radius: Number(row.radius_meter),
      isAktif: Boolean(row.is_aktif),
    }));
  } catch (error) {
    console.error("Failed to fetch kantor:", error);
  }

  return <LokasiKantorClient items={items} />;
}

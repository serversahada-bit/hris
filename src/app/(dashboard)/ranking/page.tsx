import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import db from "@/lib/db";
import RankingClient from "./RankingClient";
import { getRankingPhoto, parseDateParam, type RankingRow } from "./ranking-utils";

export const metadata = {
  title: "Ranking Absen - Great HRIS",
  description: "Leaderboard kedatangan karyawan reguler berdasarkan jam masuk.",
};

export const revalidate = 0;

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  if (!cookieStore.get("admin_id")?.value) {
    redirect("/");
  }

  const selectedDate = parseDateParam(typeof params.tanggal === "string" ? params.tanggal : undefined);

  const sql = `
    SELECT
      p.jam_masuk,
      p.status,
      p.foto_masuk,
      k.nama,
      k.jabatan,
      k.foto AS foto_profil
    FROM presensi p
    JOIN karyawan k ON p.karyawan_id = k.id
    WHERE p.tanggal = ?
      AND p.jam_masuk >= '07:00:00'
      AND (k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)
    ORDER BY p.jam_masuk ASC
  `;

  let ranking: RankingRow[] = [];

  try {
    const [rows] = await db.query(sql, [selectedDate]);
    ranking = (rows as RankingRow[]).map((row) => ({
      ...row,
      foto_masuk: getRankingPhoto(row),
      foto_profil: null,
    }));
  } catch (error) {
    console.error("Failed to fetch ranking data:", error);
  }

  return <RankingClient ranking={ranking} selectedDate={selectedDate} />;
}

import db from "@/lib/db";
import KaryawanClient from "./KaryawanClient";

export const metadata = {
  title: "Data Karyawan - Great HRIS",
  description: "Kelola informasi personal, kontak, dan kepegawaian seluruh tim.",
};

export const revalidate = 0; // Disable cache

export default async function KaryawanPage() {
  let employees: any[] = [];
  
  try {
    const [rows]: any = await db.query(`
      SELECT 
        karyawan.*,
        (SELECT jam_masuk FROM presensi WHERE karyawan_id = karyawan.id AND tanggal = CURDATE() LIMIT 1) AS jam_masuk_hari_ini,
        (SELECT foto_masuk FROM presensi WHERE karyawan_id = karyawan.id AND tanggal = CURDATE() LIMIT 1) AS foto_masuk_hari_ini
      FROM karyawan 
      ORDER BY id DESC
    `);
    
    // Process the data like PHP did
    employees = rows.map((row: any) => {
      // Inisial
      const nama = row.nama ? String(row.nama).trim() : '';
      const words = nama.split(/\s+/);
      let inisial = "";
      if (words.length >= 2) {
        inisial = (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
      } else {
        inisial = nama.substring(0, 2).toUpperCase();
      }
      
      // Kehadiran hari ini
      const jam_masuk = row.jam_masuk_hari_ini;
      const isPresent = Boolean(jam_masuk && jam_masuk !== '');
      const avatarBg = isPresent ? '#10b981' : '#cbd5e1'; // Emerald or Slate
      
      // Fotourl logic simplified
      let foto_url = '';
      if (row.foto_masuk_hari_ini) {
        foto_url = `/api/legacy-files/absen/${row.foto_masuk_hari_ini}`;
      } else if (row.foto) {
        foto_url = `/api/legacy-files/admin/uploads/${encodeURIComponent(row.foto)}`;
      } else {
        foto_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=${avatarBg.replace('#', '')}&color=fff`;
      }
      
      return {
        ...row,
        inisial,
        avatarBg,
        foto_url
      };
    });

  } catch (error) {
    console.error("Failed to fetch karyawan:", error);
  }

  return <KaryawanClient employees={employees} />;
}

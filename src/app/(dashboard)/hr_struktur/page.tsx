import db from "@/lib/db";
import StrukturClient from "./StrukturClient";

export default async function HRStrukturPage() {
  let karyawanList: any[] = [];
  let managerOptions: any[] = [];

  try {
    const sqlList = `
      SELECT 
          k.id,
          k.nama,
          COALESCE(k.email_login, k.email) AS email_kerja,
          k.organisasi,
          k.jabatan,
          k.posisi,
          ts.manager_id,
          m.nama AS manager_nama
      FROM karyawan k
      LEFT JOIN tim_saya ts ON ts.anggota_id = k.id
      LEFT JOIN karyawan m  ON m.id = ts.manager_id
      WHERE (k.status_karyawan != 'Non-Aktif' OR k.status_karyawan IS NULL)
      ORDER BY k.nama ASC
    `;
    const [resList]: any = await db.query(sqlList);
    karyawanList = resList;

    const sqlMgr = `
      SELECT 
          id,
          nama,
          COALESCE(email_login, email) AS email_kerja,
          organisasi,
          jabatan,
          posisi,
          peran
      FROM karyawan
      WHERE (status_karyawan != 'Non-Aktif' OR status_karyawan IS NULL)
      ORDER BY k.nama ASC
    `;
    // Wait, the order by k.nama ASC will fail if 'k' alias is not defined
    const [resMgr]: any = await db.query(sqlMgr.replace('k.nama', 'nama'));
    managerOptions = resMgr;

  } catch (error) {
    console.error("Database query error:", error);
  }

  return (
    <StrukturClient 
      karyawanList={karyawanList} 
      managerOptions={managerOptions} 
    />
  );
}

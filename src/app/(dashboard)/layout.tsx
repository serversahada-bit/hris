import db from "@/lib/db";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { cookies } from "next/headers";

export const metadata = {
  title: "Dashboard - Great HRIS",
  description: "Admin Portal",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let pendingIzinCount = 0;

  // Read username from cookie if available, fallback to HC Nurul
  const cookieStore = await cookies();
  const userName = cookieStore.get("admin_nama")?.value || "HC Nurul";

  try {
    const [rows]: any = await db.query(
      `SELECT COUNT(*) AS c FROM pengajuan_izin WHERE status = 'Pending' AND (manager_status IS NULL OR manager_status = 'Pending')`
    );
    if (rows && rows.length > 0) {
      pendingIzinCount = rows[0].c;
    }
  } catch (error) {
    // If table doesn't exist or other error, ignore
    pendingIzinCount = 0;
  }

  return (
    <DashboardLayoutClient pendingIzinCount={pendingIzinCount} userName={userName}>
      {children}
    </DashboardLayoutClient>
  );
}

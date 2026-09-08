import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings - Great HRD Workspace",
  description: "Kelola profil dan password akun admin.",
};

export const revalidate = 0;

type AdminRow = {
  id: number;
  nama: string | null;
  email: string | null;
  role: string | null;
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("admin_id")?.value;

  if (!adminId) {
    redirect("/");
  }

  let admin: AdminRow | null = null;

  try {
    const [rows] = await db.query(
      "SELECT id, nama, email, role FROM admins WHERE id = ? LIMIT 1",
      [adminId]
    );
    const list = rows as AdminRow[];
    admin = list[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch admin profile:", error);
  }

  if (!admin) {
    redirect("/");
  }

  return <SettingsClient admin={admin} />;
}

"use server";

import db from "@/lib/db";
import { cookies } from "next/headers";

async function getCurrentAdminId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("admin_id")?.value;
  return id ? Number(id) : null;
}

export async function updateProfile(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!nama || !email) {
    return { error: "Nama dan email wajib diisi." };
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM admins WHERE email = ? AND id <> ?",
      [email, adminId]
    );
    if ((existing as { id: number }[]).length > 0) {
      return { error: "Email sudah dipakai admin lain." };
    }

    await db.query("UPDATE admins SET nama = ?, email = ? WHERE id = ?", [nama, email, adminId]);

    const cookieStore = await cookies();
    cookieStore.set("admin_nama", nama, { path: "/" });

    return { success: true, nama };
  } catch (error) {
    console.error("Failed to update admin profile:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal menyimpan profil: ${message}` };
  }
}

export async function changePassword(formData: FormData) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return { error: "Sesi tidak valid. Silakan login ulang." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Semua kolom password wajib diisi." };
  }
  if (newPassword.length < 6) {
    return { error: "Password baru minimal 6 karakter." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password baru tidak cocok." };
  }

  try {
    const [rows] = await db.query("SELECT password FROM admins WHERE id = ?", [adminId]);
    const adminRows = rows as { password: string }[];
    if (adminRows.length !== 1) {
      return { error: "Akun admin tidak ditemukan." };
    }

    // Note: comparing plain text password, mengikuti pola login yang sudah ada.
    if (currentPassword !== adminRows[0].password) {
      return { error: "Password saat ini salah." };
    }

    await db.query("UPDATE admins SET password = ? WHERE id = ?", [newPassword, adminId]);

    return { success: true };
  } catch (error) {
    console.error("Failed to change admin password:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal mengubah password: ${message}` };
  }
}

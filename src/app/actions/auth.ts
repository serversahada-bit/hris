"use server";

import db from "@/lib/db";

import { cookies } from "next/headers";

export async function doLogin(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    // Query admins table
    const [rows]: any = await db.query("SELECT * FROM admins WHERE email = ?", [email]);
    
    if (rows.length === 1) {
      const row = rows[0];
      
      // Note: Comparing plain text password based on original PHP logic
      if (password === row.password) {
        const cookieStore = await cookies();
        
        // Set session cookies
        cookieStore.set("admin_id", row.id.toString(), { path: "/" });
        cookieStore.set("admin_nama", row.nama, { path: "/" });
        cookieStore.set("admin_role", row.role, { path: "/" });
        
        return { success: true }; 
      } else {
        return { error: "Password salah!" };
      }
    } else {
      return { error: "Email tidak terdaftar!" };
    }
  } catch (error: any) {
    console.error("Database Connection Error:", error);
    return { error: `Gagal terhubung ke database: ${error.message}` };
  }
}

export async function doLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_id");
  cookieStore.delete("admin_nama");
  cookieStore.delete("admin_role");
}

"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/app/actions/settings";

type AdminRow = {
  id: number;
  nama: string | null;
  email: string | null;
  role: string | null;
};

export default function SettingsClient({ admin }: { admin: AdminRow }) {
  const [nama, setNama] = useState(admin.nama ?? "");
  const [email, setEmail] = useState(admin.email ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result?.error) {
      setProfileMsg({ type: "error", text: result.error });
    } else {
      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui." });
    }
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    if (result?.error) {
      setPasswordMsg({ type: "error", text: result.error });
    } else {
      setPasswordMsg({ type: "success", text: "Password berhasil diubah." });
      e.currentTarget.reset();
    }
    setPasswordLoading(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Kelola profil dan password akun kamu.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <div className="font-extrabold text-slate-900 dark:text-white">Profil Akun</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Role: <span className="font-semibold text-slate-700 dark:text-slate-300">{admin.role || "-"}</span></div>
          </div>

          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
            {profileMsg && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40"
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Nama</label>
              <input
                type="text"
                name="nama"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Email</label>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-95 disabled:opacity-60 transition"
            >
              {profileLoading ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>
        </section>

        {/* Password */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <div className="font-extrabold text-slate-900 dark:text-white">Ubah Password</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimal 6 karakter.</div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            {passwordMsg && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Password Saat Ini</label>
              <input
                type="password"
                name="currentPassword"
                required
                autoComplete="current-password"
                className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Password Baru</label>
              <input
                type="password"
                name="newPassword"
                required
                autoComplete="new-password"
                className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Konfirmasi Password Baru</label>
              <input
                type="password"
                name="confirmPassword"
                required
                autoComplete="new-password"
                className="mt-2 w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-300 transition"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="h-11 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:opacity-95 disabled:opacity-60 transition"
            >
              {passwordLoading ? "Menyimpan..." : "Ubah Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

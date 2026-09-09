"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  pendingIzinCount: number;
  isCollapsed?: boolean;
}

const GA_PATHS = ["/legal", "/pengumuman_hc", "/inventaris_hc"];

export default function Sidebar({ pendingIzinCount, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [isGaOpen, setIsGaOpen] = useState(() => GA_PATHS.some((p) => pathname.includes(p)));

  const menuClassLight = (menuPaths: string[]) => {
    const isActive = menuPaths.some((p) => {
      if (p === "/dashboard") return pathname === "/dashboard";
      return pathname.includes(p);
    });
    if (isActive) {
      return "bg-slate-100 dark:bg-slate-700/50 text-[#3c50e0] dark:text-blue-400 font-medium";
    }
    return "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-all";
  };

  const iconClassLight = (menuPaths: string[]) => {
    const isActive = menuPaths.some((p) => {
      if (p === "/dashboard") return pathname === "/dashboard";
      return pathname.includes(p);
    });
    return isActive ? "text-[#3c50e0] dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors";
  };

  const linkClass = (paths: string[]) =>
    `group flex items-center ${
      isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4"
    } py-2.5 mb-1 rounded-sm transition-colors ${menuClassLight(paths)}`;

  return (
    <>
      {/* Header Logo */}
      <div
        className={`h-20 ${
          isCollapsed ? "px-0 justify-center" : "px-6"
        } flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 shrink-0 bg-transparent`}
      >
        <div className="h-8 w-8 min-w-[32px] rounded-md flex items-center justify-center overflow-hidden">
          <Image src="/logo.png" alt="Great HRIS" width={32} height={32} className="h-8 w-8 object-contain" />
        </div>
        {!isCollapsed && (
          <div className="leading-tight whitespace-nowrap overflow-hidden">
            <div className="font-bold text-[22px] text-slate-800 dark:text-white tracking-tight flex items-center gap-1">
              Great HRIS
            </div>
            <div className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
              PT Sahada Laku Utama
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-6 overflow-y-auto overflow-x-hidden flex flex-col bg-transparent ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed && (
          <div className="px-4 mb-4 text-[12px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Menu
          </div>
        )}
        {isCollapsed && <div className="mb-4"></div>} {/* Spacer when collapsed */}

        <Link href="/dashboard" className={linkClass(["/dashboard"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/dashboard"])}`}>grid_view</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Dashboard</span>}
        </Link>

        <Link href="/karyawan" className={linkClass(["/karyawan", "/detail"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/karyawan", "/detail"])}`}>group</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Data Karyawan</span>}
        </Link>

        <Link href="/hr_struktur" className={linkClass(["/hr_struktur"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/hr_struktur"])}`}>account_tree</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Struktur & Approval</span>}
        </Link>

        <Link href="/kehadiran" className={linkClass(["/kehadiran", "/setting_shift_streamer"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/kehadiran", "/setting_shift_streamer"])}`}>fact_check</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Kehadiran</span>}
        </Link>

        <Link href="/mengaji_monitor" className={linkClass(["/mengaji_monitor", "/mengaji"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/mengaji_monitor", "/mengaji"])}`}>auto_stories</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Mengaji Harian</span>}
        </Link>

        <Link href="/ranking" className={linkClass(["/ranking"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/ranking"])}`}>emoji_events</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Ranking Absen</span>}
        </Link>

        <Link href="/izin" className={linkClass(["/izin"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/izin"])} relative`}>
            event_busy
            {isCollapsed && pendingIzinCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#3c50e0]"></span>
            )}
          </span>
          {!isCollapsed && (
            <>
              <span className="text-[15px] whitespace-nowrap flex-1">Izin & Cuti</span>
              {pendingIzinCount > 0 && (
                <span className="h-5 w-5 rounded bg-[#3c50e0] text-white flex items-center justify-center text-[11px] font-bold">
                  {pendingIzinCount}
                </span>
              )}
            </>
          )}
        </Link>

        <Link href="/cuti_tahunan" className={linkClass(["/cuti_tahunan"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/cuti_tahunan"])}`}>calendar_month</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Data Cuti</span>}
        </Link>

        <Link href="/riwayat_lembur" className={linkClass(["/riwayat_lembur", "/lembur", "/approval_lembur"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/riwayat_lembur", "/lembur", "/approval_lembur"])}`}>schedule</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap flex-1">Lembur</span>}
        </Link>

        {/* Settings Group */}
        <Link
          href="/settings"
          className={linkClass(["/settings"])}
        >
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/settings"])}`}>settings</span>
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <div className="mt-8 mb-4">
          {!isCollapsed && (
            <div className="px-4 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
              Support
            </div>
          )}
        </div>

        <Link href="/peraturan_perusahaan" className={linkClass(["/peraturan_perusahaan"])}>
          <span className={`material-symbols-outlined text-[20px] ${iconClassLight(["/peraturan_perusahaan"])}`}>gavel</span>
          {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Aturan Perusahaan</span>}
        </Link>

        {/* General Affair Group */}
        {isCollapsed ? (
          <Link href="/legal" className={linkClass(GA_PATHS)} title="General Affair">
            <span className={`material-symbols-outlined text-[20px] ${iconClassLight(GA_PATHS)}`}>corporate_fare</span>
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsGaOpen((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 mb-1 rounded-sm transition-colors ${menuClassLight(GA_PATHS)}`}
            >
              <span className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] ${iconClassLight(GA_PATHS)}`}>corporate_fare</span>
                <span className="text-[15px] whitespace-nowrap">General Affair</span>
              </span>
              <span
                className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isGaOpen ? "rotate-180" : ""}`}
              >
                expand_more
              </span>
            </button>

            {isGaOpen && (
              <div className="ml-4 pl-4 mb-1 border-l border-slate-200 dark:border-slate-700 flex flex-col">
                <Link href="/legal" className={linkClass(["/legal"])}>
                  <span className={`material-symbols-outlined text-[18px] ${iconClassLight(["/legal"])}`}>balance</span>
                  <span className="text-[14px] whitespace-nowrap">Legal</span>
                </Link>
                <Link href="/pengumuman_hc" className={linkClass(["/pengumuman_hc"])}>
                  <span className={`material-symbols-outlined text-[18px] ${iconClassLight(["/pengumuman_hc"])}`}>campaign</span>
                  <span className="text-[14px] whitespace-nowrap">Pengumuman HC</span>
                </Link>
                <Link href="/inventaris_hc" className={linkClass(["/inventaris_hc"])}>
                  <span className={`material-symbols-outlined text-[18px] ${iconClassLight(["/inventaris_hc"])}`}>inventory_2</span>
                  <span className="text-[14px] whitespace-nowrap">Inventaris HC</span>
                </Link>
              </div>
            )}
          </>
        )}

        <div className="mt-auto pt-8">
          <Link
            href="/"
            className={`group flex items-center ${isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-4'} py-2.5 rounded-sm transition-colors text-rose-500 hover:bg-rose-50 font-medium`}
            title="Keluar Sistem"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {!isCollapsed && <span className="text-[15px] whitespace-nowrap">Keluar Sistem</span>}
          </Link>
        </div>
      </nav>
    </>
  );
}

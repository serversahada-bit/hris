"use client";

import { useState, useRef, useEffect } from "react";
import { doLogout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

interface TopbarProps {
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  pendingIzinCount: number;
  userName: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Topbar({ toggleSidebar, openMobileSidebar, pendingIzinCount, userName, isDarkMode, toggleDarkMode }: TopbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await doLogout();
    router.push("/");
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-800 flex items-center justify-between px-6 lg:px-8 shrink-0 relative z-20 shadow-sm border-b border-slate-100 dark:border-slate-700 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Open Sidebar */}
        <button
          onClick={openMobileSidebar}
          className="lg:hidden p-2 -ml-2 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {/* Desktop Toggle Sidebar */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:block p-2 -ml-2 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="Toggle Sidebar"
        >
          <span className="material-symbols-outlined">menu_open</span>
        </button>

        {/* Search bar */}
        <div className="hidden md:flex relative w-full max-w-md ml-2 group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            type="text"
            placeholder="Search or type command..."
            className="w-full h-10 pl-10 pr-12 rounded bg-slate-50 dark:bg-slate-900 border-none text-[14px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 focus:bg-slate-100 dark:focus:bg-slate-950 transition-all placeholder:text-slate-400"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">⌘K</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isDarkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Notification */}
        <button className="relative h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          {pendingIzinCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          )}
        </button>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <div 
            className="flex items-center gap-3 pl-2 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200 leading-tight group-hover:text-[#3c50e0] transition-colors">
                {userName}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-[#f1f5f9] dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 flex items-center justify-center overflow-hidden">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=f1f5f9&color=475569`} alt="User" />
            </div>
            <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <button 
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsUploadModalOpen(true);
                }}
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">account_circle</span>
                Edit Foto
              </button>
              
              <div className="h-px w-full bg-slate-100 dark:bg-slate-700 my-1"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Photo Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsUploadModalOpen(false)}
          ></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Unggah Foto Profil</h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-8 flex flex-col items-center justify-center text-center hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer w-full">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-3">cloud_upload</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Klik untuk memilih foto</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">SVG, PNG, JPG atau GIF (Maks. 800x400px)</p>
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  alert("Simulasi unggah berhasil! (Fitur backend belum tersedia)");
                  setIsUploadModalOpen(false);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[#3c50e0] hover:bg-blue-600 transition shadow-sm"
              >
                Simpan Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

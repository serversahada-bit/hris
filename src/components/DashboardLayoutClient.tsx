"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayoutClient({
  children,
  pendingIzinCount,
  pendingLegalitasCount,
  userName,
}: {
  children: React.ReactNode;
  pendingIzinCount: number;
  pendingLegalitasCount: number;
  userName: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const collapsed = localStorage.getItem("sidebar_collapsed") === "true";
    setIsCollapsed(collapsed);
    
    // Check dark mode preference
    if (localStorage.getItem("theme") === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("sidebar_collapsed", String(newVal));
      return newVal;
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newVal;
    });
  };

  const openMobileSidebar = () => setIsMobileOpen(true);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <div className={`flex h-screen overflow-hidden bg-[#f1f5f9] dark:bg-slate-900 ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all duration-300
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "lg:w-[88px]" : "lg:w-[260px] w-[260px]"}`}
      >
        <Sidebar pendingIzinCount={pendingIzinCount} pendingLegalitasCount={pendingLegalitasCount} isCollapsed={isCollapsed} />
      </aside>

      {/* Main Wrapper */}
      <div
        className={`main-wrapper flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:pl-[88px]" : "lg:pl-[260px]"}`}
      >
        <Topbar
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
          pendingIzinCount={pendingIzinCount}
          userName={userName}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <main className="relative flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-[1440px] mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

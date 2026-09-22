"use client";

import { createContext, useCallback, useContext, useState } from "react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertState {
  message: string;
  type: AlertType;
}

interface AlertContextValue {
  showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const ICONS: Record<AlertType, string> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

const ICON_STYLES: Record<AlertType, string> = {
  success: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300",
  error: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300",
  warning: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300",
  info: "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300",
};

// Popup notifikasi pengganti window.alert() bawaan browser, dipakai lewat
// hook useAlert() di seluruh komponen client dashboard. Provider ini dipasang
// sekali di DashboardLayoutClient supaya semua halaman di bawahnya bisa pakai.
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = "info") => {
    setAlert({ message, type });
  }, []);

  const close = useCallback(() => setAlert(null), []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {alert && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={close}></div>
          <div className="relative w-full max-w-sm rounded-3xl bg-white/90 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_60px_140px_-90px_rgba(2,6,23,.75)] overflow-hidden">
            <div className="p-6 text-center">
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${ICON_STYLES[alert.type]}`}>
                <span className="material-symbols-outlined text-[26px]">{ICONS[alert.type]}</span>
              </div>
              <p className="mt-4 text-slate-700 dark:text-slate-200 font-semibold whitespace-pre-wrap">{alert.message}</p>
              <button
                type="button"
                onClick={close}
                autoFocus
                className="mt-6 h-11 w-full rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-700 to-brand-500 hover:opacity-90 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    // Fallback kalau kepanggil di luar AlertProvider (seharusnya tidak terjadi
    // karena provider-nya dipasang di root DashboardLayoutClient).
    return { showAlert: (message: string) => window.alert(message) };
  }
  return ctx;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error";
type ToastState = { message: string; type: ToastType; key: number } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const counter = useRef(0);

  const notify = useCallback((message: string, type: ToastType = "success") => {
    counter.current += 1;
    setToast({ message, type, key: counter.current });
  }, []);

  const close = useCallback(() => setToast(null), []);

  return { toast, notify, close };
}

export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!toast) return;
    setVisible(false);
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => setVisible(false), 3500);
    const closeTimer = setTimeout(onClose, 3900);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.key]);

  if (!mounted || !toast) return null;

  const isSuccess = toast.type === "success";

  return createPortal(
    <div
      className={`fixed top-6 right-6 z-[200000] transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
      }`}
    >
      <div
        className={`flex items-start gap-3 rounded-2xl shadow-2xl border px-5 py-4 max-w-sm bg-white dark:bg-slate-800 ${
          isSuccess
            ? "border-emerald-200 dark:border-emerald-800/30"
            : "border-rose-200 dark:border-rose-800/30"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] mt-0.5 ${
            isSuccess ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {isSuccess ? "check_circle" : "error"}
        </span>
        <p className="text-sm font-semibold flex-1 text-slate-700 dark:text-slate-200">{toast.message}</p>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

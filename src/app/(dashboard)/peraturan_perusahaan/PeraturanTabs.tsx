import Link from "next/link";

export default function PeraturanTabs({
  active,
  pendingCount,
}: {
  active: "dokumen" | "pengajuan";
  pendingCount: number;
}) {
  const tabClass = (isActive: boolean) =>
    `h-10 px-4 rounded-2xl font-extrabold text-xs transition inline-flex items-center justify-center gap-2 ${
      isActive
        ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-sm border border-white/40"
        : "bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-800 dark:hover:text-brand-300 hover:bg-white dark:hover:bg-slate-700 border border-transparent"
    }`;

  return (
    <div className="self-start inline-flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-1 flex-wrap">
      <Link href="/peraturan_perusahaan" className={tabClass(active === "dokumen")}>
        <span className="material-symbols-outlined text-[18px]">description</span>
        Dokumen
      </Link>
      <Link href="/peraturan_perusahaan?tab=pengajuan" className={tabClass(active === "pengajuan")}>
        <span className="material-symbols-outlined text-[18px]">outbox</span>
        Pengajuan Karyawan
        {pendingCount > 0 && (
          <span
            className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-extrabold grid place-items-center ${
              active === "pengajuan" ? "bg-white text-brand-700" : "bg-rose-600 text-white"
            }`}
          >
            {pendingCount}
          </span>
        )}
      </Link>
    </div>
  );
}

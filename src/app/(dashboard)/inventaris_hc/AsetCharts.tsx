"use client";

import { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { formatRupiah } from "@/lib/asetUtils";

ChartJS.register(ArcElement, Tooltip);

// Fixed categorical order (never cycled) — validated palette, light/dark step per slot.
const CATEGORY_COLOR_LIGHT: Record<string, string> = {
  Elektronik: "#2a78d6",
  Furniture: "#eb6834",
  Komputer: "#1baf7a",
  Kendaraan: "#eda100",
  "Peralatan Kantor": "#e87ba4",
  "Gedung & Bangunan": "#008300",
  Lainnya: "#4a3aa7",
};

const CATEGORY_COLOR_DARK: Record<string, string> = {
  Elektronik: "#3987e5",
  Furniture: "#d95926",
  Komputer: "#199e70",
  Kendaraan: "#c98500",
  "Peralatan Kantor": "#d55181",
  "Gedung & Bangunan": "#008300",
  Lainnya: "#9085e9",
};

const FALLBACK_COLOR_LIGHT = "#e34948";
const FALLBACK_COLOR_DARK = "#e66767";
const EMPTY_COLOR_LIGHT = "#e2e8f0";
const EMPTY_COLOR_DARK = "#334155";

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

type Slice = { label: string; value: number; color: string };

function DonutCard({
  title,
  slices,
  totalLabel,
  isDark,
  emptyColor,
  formatValue,
}: {
  title: string;
  slices: Slice[];
  totalLabel: string;
  isDark: boolean;
  emptyColor: string;
  formatValue: (n: number) => string;
}) {
  const hasData = slices.length > 0;

  const data = {
    labels: hasData ? slices.map((s) => s.label) : ["Belum ada data"],
    datasets: [
      {
        data: hasData ? slices.map((s) => s.value) : [1],
        backgroundColor: hasData ? slices.map((s) => s.color) : [emptyColor],
        borderWidth: 2,
        borderColor: isDark ? "#1e293b" : "#ffffff",
        hoverOffset: hasData ? 6 : 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: hasData,
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context: { label: string; raw: unknown }) => ` ${context.label}: ${formatValue(Number(context.raw))}`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-3">{title}</div>
      <div className="relative h-[160px] w-[160px]">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
          <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{totalLabel}</span>
        </div>
      </div>
      <div className="mt-4 w-full flex flex-col gap-1.5">
        {hasData ? (
          slices.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">{formatValue(s.value)}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-400 dark:text-slate-500 text-center">Belum ada data aset</div>
        )}
      </div>
    </div>
  );
}

export default function AsetCharts({
  items,
  summary,
}: {
  items: { kategori: string; nilaiSekarang: number }[];
  summary: { totalAset: number; totalNilaiSekarang: number; rusakRingan: number; rusakBerat: number };
}) {
  const isDark = useIsDarkMode();

  const { jumlahSlices, nilaiSlices } = useMemo(() => {
    const byKategori = new Map<string, { jumlah: number; nilai: number }>();
    for (const item of items) {
      const cur = byKategori.get(item.kategori) ?? { jumlah: 0, nilai: 0 };
      cur.jumlah += 1;
      cur.nilai += item.nilaiSekarang;
      byKategori.set(item.kategori, cur);
    }

    const colorMap = isDark ? CATEGORY_COLOR_DARK : CATEGORY_COLOR_LIGHT;
    const fallback = isDark ? FALLBACK_COLOR_DARK : FALLBACK_COLOR_LIGHT;

    // Fixed hue order: iterate known categories first, then any custom leftover.
    const orderedKeys = [...Object.keys(CATEGORY_COLOR_LIGHT), ...[...byKategori.keys()].filter((k) => !(k in CATEGORY_COLOR_LIGHT))];

    const jumlahSlices: Slice[] = [];
    const nilaiSlices: Slice[] = [];
    for (const kategori of orderedKeys) {
      const entry = byKategori.get(kategori);
      if (!entry) continue;
      const color = colorMap[kategori] ?? fallback;
      jumlahSlices.push({ label: kategori, value: entry.jumlah, color });
      nilaiSlices.push({ label: kategori, value: entry.nilai, color });
    }

    return { jumlahSlices, nilaiSlices };
  }, [items, isDark]);

  return (
    <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-8">
        <DonutCard
          title="Jumlah Aset per Kategori"
          slices={jumlahSlices}
          totalLabel={`${summary.totalAset} Item`}
          isDark={isDark}
          emptyColor={isDark ? EMPTY_COLOR_DARK : EMPTY_COLOR_LIGHT}
          formatValue={(n) => String(n)}
        />
        <DonutCard
          title="Nilai Aset per Kategori"
          slices={nilaiSlices}
          totalLabel={formatRupiah(summary.totalNilaiSekarang).replace("Rp", "Rp ").replace(/,00$/, "")}
          isDark={isDark}
          emptyColor={isDark ? EMPTY_COLOR_DARK : EMPTY_COLOR_LIGHT}
          formatValue={(n) => formatRupiah(n)}
        />

        <div className="flex flex-col justify-center gap-4 lg:border-l lg:border-slate-100 lg:dark:border-slate-700 lg:pl-8 lg:min-w-[200px]">
          <div className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Ringkasan</div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Jumlah Aset</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">{summary.totalAset}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Nilai Sekarang</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatRupiah(summary.totalNilaiSekarang)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Rusak Ringan</span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{summary.rusakRingan}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Rusak Berat</span>
              <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{summary.rusakBerat}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

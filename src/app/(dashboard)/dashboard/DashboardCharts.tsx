"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
ChartJS.defaults.color = "#64748b";

interface DashboardChartsProps {
  chartDates: string[];
  chartHadir: number[];
  chartTerlambat: number[];
  chartMengaji: number[];
  statusKerja: { labels: string[]; values: number[] };
  genderData: { labels: string[]; values: number[] };
  izinData: { labels: string[]; values: number[] };
  lemburData: { labels: string[]; values: number[] };
  divisiData: { labels: string[]; values: number[] };
}

export function AttendanceChart({ dates, hadir, terlambat }: { dates: string[]; hadir: number[]; terlambat: number[] }) {
  const data = {
    labels: dates,
    datasets: [
      {
        label: "Hadir",
        data: hadir,
        backgroundColor: "#3c50e0",
        borderRadius: 4,
        barThickness: 12,
      },
      {
        label: "Terlambat",
        data: terlambat,
        backgroundColor: "#80caee",
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "#f1f5f9", drawBorder: false }, border: { display: false } },
      x: { grid: { display: false }, border: { display: false } },
    },
  };

  return <Bar data={data} options={options} />;
}

export function MengajiChart({ dates, mengaji }: { dates: string[]; mengaji: number[] }) {
  const data = {
    labels: dates,
    datasets: [
      {
        label: "Setoran",
        data: mengaji,
        borderColor: "#3c50e0",
        backgroundColor: "rgba(60, 80, 224, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { display: false },
      x: { grid: { display: false }, border: { display: false } },
    },
  };

  return <Line data={data} options={options} />;
}

export function StatusKerjaChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: "#3c50e0",
        borderRadius: 4,
        barThickness: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { grid: { display: false }, border: { display: false } },
    },
  };

  return <Bar data={data} options={options} />;
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "80%",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          if (context.label === "Belum ada data") return " 0";
          return " " + context.raw;
        },
      },
    },
  },
};

const getDoughnutData = (labels: string[], values: number[], colors: string[]) => {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return {
      labels: ["Belum ada data"],
      datasets: [{ data: [1], backgroundColor: ["#f1f5f9"], borderWidth: 0 }],
    };
  }
  return {
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 4, borderColor: "#ffffff" }],
  };
};

export function GenderChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = getDoughnutData(labels, values, ["#3c50e0", "#80caee", "#e2e8f0"]);
  return <Doughnut data={data} options={doughnutOptions} />;
}

export function IzinChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = getDoughnutData(labels, values, ["#f59e0b", "#fbbf24", "#fde68a"]);
  return <Doughnut data={data} options={doughnutOptions} />;
}

export function LemburChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = getDoughnutData(labels, values, ["#f43f5e", "#10b981", "#64748b"]);
  return <Doughnut data={data} options={doughnutOptions} />;
}

export function DivisiChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = getDoughnutData(labels, values, [
    "#3c50e0", "#0ea5e9", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316", "#eab308", "#10b981",
  ]);
  const options = {
    ...doughnutOptions,
    cutout: "0%", // It's a pie chart essentially
  };
  return <Pie data={data} options={options} />;
}

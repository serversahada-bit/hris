"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatusKerjaChart({ labels, values }: { labels: string[], values: number[] }) {
  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#3c50e0", // Blue
          "#80caee", // Light Blue
          "#10b981", // Emerald
          "#f59e0b", // Amber
          "#64748b"  // Slate
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}

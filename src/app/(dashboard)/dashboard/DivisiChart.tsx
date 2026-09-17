"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function DivisiChart({ labels, values }: { labels: string[], values: number[] }) {
  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: "#3c50e0",
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#94a3b8", // slate-400
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.1)", // slate-400 with 10% opacity
          tickLength: 0,
        },
        ticks: {
          stepSize: 1,
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

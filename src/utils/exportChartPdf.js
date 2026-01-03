import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip } from "chart.js";
import jsPDF from "jspdf";

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip
);

/* ===========================
   UTILS
=========================== */
function average(arr) {
  const valid = arr.filter(n => Number.isFinite(n));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function stdDev(arr) {
  const avg = average(arr);
  const valid = arr.filter(n => Number.isFinite(n));
  if (!valid.length) return 0;
  const variance =
    valid.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / valid.length;
  return Math.sqrt(variance);
}

/* ===========================
   MAIN EXPORT PDF
=========================== */
export async function exportChartPdf(sessions, filters = {}) {
  if (!sessions?.length) return;

  // 🔴 Ordina per data (vecchie → recenti)
  const sorted = sessions
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = [];
  const arrowAvg = [];
  const endAvg = [];
  const arrowSd = [];

  sorted.forEach(s => {
    const volleys = s.volleys || [];
    const arrows = volleys.flatMap(v =>
      (v.arrows || []).map(a => (a === "X" ? 10 : a))
    );

    labels.push(new Date(s.date).toLocaleDateString("it-IT"));
    arrowAvg.push(Number(average(arrows).toFixed(2)));
    endAvg.push(Number(average(volleys.map(v => v.total)).toFixed(2)));
    arrowSd.push(Number(stdDev(arrows).toFixed(2)));
  });

  /* ===========================
     CREATE OFFSCREEN CANVAS
  =========================== */
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 500;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
  throw new Error("Canvas context not available");
}

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Arrow Average",
        data: arrowAvg,
        borderColor: "#2563EB",
        backgroundColor: "#2563EB",
        tension: 0.3,
        pointRadius: 3,
        yAxisID: "y"
      },
      {
        label: "End Average",
        data: endAvg,
        borderColor: "#F97316",
        backgroundColor: "#F97316",
        tension: 0.3,
        pointRadius: 3,
        yAxisID: "y"
      },
      {
        label: "Arrow Consistency (SD)",
        data: arrowSd,
        borderColor: "#9CA3AF",
        backgroundColor: "rgba(156,163,175,0.35)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        yAxisID: "y1"
      }
    ]
  },
  options: {
    responsive: false,
    maintainAspectRatio: false,
    animation: {
      duration: 1 // ⚠️ FONDAMENTALE
    },
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Performance Trend (filtered sessions)",
        font: { size: 18 }
      }
    },
    scales: {
      y: {
        title: { display: true, text: "Average Score" }
      },
      y1: {
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Consistency (Std Dev)" }
      }
    }
  }
});

// ✅ aspetta davvero il render
await new Promise((r) => requestAnimationFrame(r));



const imgData = canvas.toDataURL("image/png", 1.0);

const pdf = new jsPDF("landscape", "mm", "a4");
pdf.setFontSize(16);
pdf.text("Archery Tracker — Performance Report", 14, 15);

pdf.setFontSize(10);
pdf.text(
  `Filters: ${filters.from || "—"} → ${filters.to || "—"} | ${filters.distance || "all"} m | ${filters.targetType || "all"}`,
  14,
  22
);

pdf.addImage(imgData, "PNG", 10, 30, 277, 140);
pdf.save("Archery_Tracker_Performance_Chart.pdf");

// pulizia finale
chart.destroy();


}
import * as XLSX from "xlsx";

/* ===========================
   LOAD EXCEL TEMPLATE
=========================== */
async function loadTemplateOrNull() {
  try {
    const url = `${import.meta.env.BASE_URL}templates/Archery_Tracker_Template.xlsx`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // ✅ .xlsx è uno zip: deve iniziare con "PK"
    const isZip = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4B;
    if (!isZip) return null;

    return XLSX.read(arrayBuffer, { type: "array" });
  } catch {
    return null;
  }
}

function getOrCreateSheet(wb, sheetName) {
  let ws = wb.Sheets[sheetName];

  if (!ws) {
    ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  return ws;
}

function buildWorkbookFallback() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Sessions");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Volley Details");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Performance Trend");
  return wb;
}


/* ===========================
   UTILS MATEMATICI
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
   MAIN EXPORT
=========================== */

  export async function exportSessionsToExcel(sessions, filters = {}) {
  if (!sessions?.length) return;

  const wb = (await loadTemplateOrNull()) || buildWorkbookFallback();

  /* =====================================================
     SHEET 1 — SUMMARY
  ===================================================== */
  const allVolleys = sessions.flatMap(s => s.volleys || []);
  const allArrows = allVolleys.flatMap(v =>
    (v.arrows || []).map(a => (a === "X" ? 10 : a))
  );

  const totalScore = allVolleys.reduce((s, v) => s + (v.total || 0), 0);

  const summaryData = [
    ["FILTERS USED", ""],
    ["Date range", `${filters.from || "—"} → ${filters.to || "—"}`],
    ["Distance", filters.distance === "all" ? "All" : `${filters.distance} m`],
    ["Target", filters.targetType === "all" ? "All" : filters.targetType],
    ["Environment", filters.environment === "all" ? "All" : filters.environment],
    ["Session type", filters.kind === "all" ? "All" : filters.kind],
    [],
    ["KEY METRICS", ""],
    ["Total sessions", sessions.length],
    ["Total volleys", allVolleys.length],
    ["Total arrows", allArrows.length],
    ["Total score", totalScore],
    ["Arrow average", Math.round(average(allArrows) * 100) / 100],
    ["Volley average", Math.round(average(allVolleys.map(v => v.total)) * 100) / 100],
    ["Arrow consistency (Std Dev)", Math.round(stdDev(allArrows) * 100) / 100]
    ];

  const wsSummary = getOrCreateSheet(wb, "Summary");
    XLSX.utils.sheet_add_aoa(wsSummary, summaryData, { origin: "A1" });
    wb.Sheets["Summary"] = wsSummary; 
 

  /* =====================================================
     SHEET 2 — SESSIONS
  ===================================================== */
  const sessionsData = [
    [
      "Date",
      "Session name",
      "Distance (m)",
      "Target",
      "Environment",
      "Session type",
      "Total arrows",
      "Total score",
      "Arrow average",
      "Volley average",
      "Consistency (Std Dev)"
    ]
  ];

  sessions.forEach(s => {
    const volleys = s.volleys || [];
    const arrows = volleys.flatMap(v =>
      (v.arrows || []).map(a => (a === "X" ? 10 : a))
    );

    const total = volleys.reduce((sum, v) => sum + (v.total || 0), 0);

    sessionsData.push([
      new Date(s.date).toLocaleDateString("en-GB"),
      s.name || "",
      s.distance,
      s.targetType,
      s.environment,
      s.kind,
      arrows.length,
      total,
      Math.round(average(arrows) * 100) / 100,
      Math.round(average(volleys.map(v => v.total)) * 100) / 100,
      Math.round(stdDev(arrows) * 100) / 100
    ]);
  });

  const wsSessions = getOrCreateSheet(wb, "Sessions");
XLSX.utils.sheet_add_aoa(wsSessions, sessionsData, { origin: "A1" });
wb.Sheets["Sessions"] = wsSessions;

  wsSessions["!freeze"] = { xSplit: 0, ySplit: 1 };

    wsSessions["!cols"] = [
    { wch: 12 }, // Date
    { wch: 20 }, // Session name
    { wch: 12 }, // Distance (m)
    { wch: 14 }, // Target
    { wch: 14 }, // Environment
    { wch: 16 }, // Session type
    { wch: 14 }, // Total arrows
    { wch: 14 }, // Total score
    { wch: 14 }, // Arrow average
    { wch: 14 }, // Volley average
    { wch: 22 }  // Consistency (Std Dev)
    ];
  
  

  /* =====================================================
     SHEET 3 — VOLLEY DETAILS
  ===================================================== */
  const volleyData = [
    [
      "Date",
      "Session name",
      "Volley #",
      "Arrow 1",
      "Arrow 2",
      "Arrow 3",
      "Volley total",
      "Arrow average"
    ]
  ];

  sessions.forEach(s => {
    (s.volleys || []).forEach((v, idx) => {
      const arrows = (v.arrows || []).map(a => (a === "X" ? 10 : a));
      const valid = arrows.filter(a => Number.isFinite(a));

      volleyData.push([
        new Date(s.date).toLocaleDateString("en-GB"),
        s.name || "",
        idx + 1,
        arrows[0] ?? "—",
        arrows[1] ?? "—",
        arrows[2] ?? "—",
        v.total || 0,
        valid.length ? Math.round((v.total / valid.length) * 100) / 100 : "—"
      ]);
    });
  });

  const wsVolley = getOrCreateSheet(wb, "Volley Details");
XLSX.utils.sheet_add_aoa(wsVolley, volleyData, { origin: "A1" });

  wsVolley["!freeze"] = { xSplit: 0, ySplit: 1 };

    wsVolley["!cols"] = [
    { wch: 12 }, // Date
    { wch: 20 }, // Session name
    { wch: 10 }, // Volley #
    { wch: 10 }, // Arrow 1
    { wch: 10 }, // Arrow 2
    { wch: 10 }, // Arrow 3
    { wch: 14 }, // Volley total
    { wch: 14 }  // Arrow average
    ];

  

  /* =====================================================
     SHEET 4 — PERFORMANCE TREND
  ===================================================== */
  const trendData = [
    ["Date", "Arrow Avg", "Volley Avg", "Consistency (Std Dev)"]
  ];

  sessions.forEach(s => {
    const volleys = s.volleys || [];
    const arrows = volleys.flatMap(v =>
      (v.arrows || []).map(a => (a === "X" ? 10 : a))
    );

    trendData.push([
      new Date(s.date).toLocaleDateString("en-GB"),
    Math.round(average(arrows) * 100) / 100,
    Math.round(average(volleys.map(v => v.total)) * 100) / 100,
    Math.round(stdDev(arrows) * 100) / 100
    ]);
  });

  const wsTrend = getOrCreateSheet(wb, "Performance Trend");
XLSX.utils.sheet_add_aoa(wsTrend, trendData, { origin: "A1" });  

 /* =====================================================
   SAVE FILE (BROWSER SAFE)
===================================================== */

const wbout = XLSX.write(wb, {
  bookType: "xlsx",
  type: "array"
});

const blob = new Blob([wbout], {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
});

const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "Archery_Tracker_Report.xlsx";
document.body.appendChild(a);
a.click();

document.body.removeChild(a);
URL.revokeObjectURL(url);
}

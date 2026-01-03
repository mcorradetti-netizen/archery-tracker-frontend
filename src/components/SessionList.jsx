import React from "react";
import SessionFilters from "./SessionFilters";
import { exportSessionsToExcel } from "../utils/exportExcel";
import { exportChartPdf } from "../utils/exportChartPdf";

const DEFAULT_FILTERS = {
  from: null,
  to: null,
  distance: "all",
  kind: "all",
  environment: "all",
  targetType: "all"
};

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString("it-IT");
  } catch {
    return String(d);
  }
}

function sum(arr) {
  return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

export default function SessionList({ sessions, onOpen, onDelete, onNew, onOpenStatistics }) {

 const [filters, setFilters] = React.useState(DEFAULT_FILTERS);

  function confirmDelete(id) {
    const ok = window.confirm(
      "Sei sicuro di voler eliminare questa sessione?\n\nL'operazione è irreversibile."
    );
    if (!ok) return;
    onDelete(id);
  }

/* =========================
   BLOCCO FILTRI (QUI)
   ========================= */

const filteredSessions = sessions.filter((s) => {
  // PERIODO
  if (filters.from && new Date(s.date) < new Date(filters.from)) {
    return false;
  }
  if (filters.to && new Date(s.date) > new Date(filters.to)) {
    return false;
  }

  // DISTANZA (metri)
  if (
    filters.distance !== "all" &&
    String(s.distance) !== filters.distance
  ) {
    return false;
  }

  // TIPO
  if (filters.kind !== "all" && s.kind !== filters.kind) {
    return false;
  }

  // AMBIENTE
  if (
    filters.environment !== "all" &&
    s.environment !== filters.environment
  ) {
    return false;
  }

  // TARGET
  if (
    filters.targetType !== "all" &&
    s.targetType !== filters.targetType
  ) {
    return false;
  }

  return true;
}); 

  return (
    <div className="page">
      <div className="topBar">
  <div>
    <div className="title">Archery Tracker</div>
    <div className="subtitle">Sessioni salvate</div>
  </div>

  <div style={{ display: "flex", gap: 8 }}>
    <button className="ghost" onClick={onNew}>+ Nuova</button>
    <button
      className="ghost"
      onClick={() => onOpenStatistics(filteredSessions, filters)}
      aria-label="Statistiche"
      disabled={filteredSessions.length === 0}
    >
      📊
    </button>
  </div>
</div>

      <SessionFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {filteredSessions.length > 0 && (
        <div
          className="card"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16
          }}
        >
          <button
            className="primary"
            onClick={async () => {
            try {
              await exportSessionsToExcel(filteredSessions, filters);
            } catch (err) {
              console.error(err);
              alert("Export failed: " + (err?.message || err));
            }
          }}
            style={{
              padding: "8px 16px",
              fontSize: 14
            }}
          >
            ⬇️ Export Excel (filtri attivi)
          </button>

          <button
          className="primary"
          style={{ marginLeft: 12 }}
          onClick={async () => {
            try {
              await exportChartPdf(filteredSessions, filters);
            } catch (err) {
              console.error(err);
              alert("PDF export failed. See console for details.");
            }
          }}
        >
          📈 Export PDF (Performance Chart)
        </button>

        </div>
      )}

      {sessions.length === 0 ? (
        <div className="card">
          <div className="title">Nessuna sessione</div>
          <div className="subtitle">Crea la prima sessione per iniziare.</div>
          <button className="primary" onClick={onNew}>Crea sessione</button>
        </div>
      ) : (
        <div className="list">
          {filteredSessions.map((s) => {
            const totals = s.volleys?.map(v => v.total || 0) || [];

            const totalScore = sum(totals);
            const firstHalf = sum(totals.slice(0, 10));
            const secondHalf = sum(totals.slice(10, 20));
            const volleysCount = totals.length;
            const average =
              volleysCount > 0
                ? (totalScore / volleysCount).toFixed(1)
                : "–";

            return (
              <div key={s._id} className="listItem">

                {/* AREA APERTURA SESSIONE */}
                <button
                  className="ghost"
                  style={{ flex: 1, textAlign: "left" }}
                  onClick={() => onOpen(s._id)}
                >
                  <div
  className="liMain"
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto",
    columnGap: 16,
    alignItems: "center"
  }}
>
  {/* SINISTRA */}
  <div>
    <div className="liTitle">
      {s.name?.trim()
        ? s.name
        : `${s.kind}`}
    </div>

    <div className="liSub">
    {fmtDate(s.date)} • {s.environment}
    <span style={{ color: "#6B7280" }}>
      {s.distance != null && ` – ${s.distance}m`}
      {s.targetType && ` – ${s.targetType}`}
    </span>
  </div>
  </div>

  {/* DESTRA */}
  <div style={{ textAlign: "right" }}>
  <div className="liTitle">
    {totalScore} punti
    <span style={{ color: "#6B7280", marginLeft: 8 }}>
      · media {average}
    </span>
  </div>

  <div className="liSub">
    1: {firstHalf} - 2: {secondHalf}
  </div>
  </div>
</div>
                </button>

                {/* ELIMINA SESSIONE */}
                <button
                  className="ghost"
                  onClick={() => confirmDelete(s._id)}
                  aria-label="Elimina sessione"
                >
                  🗑️
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

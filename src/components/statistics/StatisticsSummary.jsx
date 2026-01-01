import React from "react";

export default function StatisticsSummary({ summary, averagePerSession }) {
  if (!summary) {
    return (
      <div className="card">
        <div className="title">Sintesi prestazione</div>
        <div className="subtitle">Nessun dato disponibile</div>
      </div>
    );
  }

  const {
    arrowsCount,
    xCount,
    tenCount,
    averageScore,
    stdDeviation,
    xPercentage,
    tenPercentage,
    firstHalfAvg,
    secondHalfAvg
  } = summary;


  const delta =
    firstHalfAvg != null && secondHalfAvg != null
      ? secondHalfAvg - firstHalfAvg
      : null;

  const trendColor =
    delta == null ? "#6B7280" : delta >= 0 ? "#059669" : "#DC2626";

  const trendLabel =
    delta == null
      ? "—"
      : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`;

  const consistency =
    stdDeviation < 2
      ? "Ottima"
      : stdDeviation < 3
      ? "Buona"
      : "Da migliorare";

  const trendText =
    delta == null
      ? ""
      : delta >= 0
      ? "Buon finale"
      : "Leggero calo nella seconda metà";

  return (
    <div className="card performanceCard">
      {/* HEADER */}
      <div className="perfHeader">
        <div className="perfIcon">🎯</div>
        <div>
          <div className="title">Sintesi prestazione</div>
          <div className="subtitle">Una lettura rapida della tua sessione</div>
        </div>
      </div>


      {/* HIGHLIGHTS */}
   <div className="perfHighlights threeCols">
  <Highlight
    label="Media freccia"
    value={averageScore?.toFixed(2)}
    note="punti"
  />

  <Highlight
    label="Media sessione"
    value={
    averagePerSession != null
      ? averagePerSession.toFixed(1)
      : null
  }
    note="punti / volée"
  />

  <Highlight
    label="Costanza"
    value={consistency}
    note={`dev. std ${stdDeviation?.toFixed(2)}`}
  />
</div>

      {/* PRECISIONE */}
<div className="perfSection">
  <div className="sectionTitle">Precisione</div>

  <div className="precisionRow">
    <Precision
      label="X"
      value={xPercentage?.toFixed(1)}
      unit="%"
      note={`${xCount} su ${arrowsCount}`}
    />

    <Precision
      label="10"
      value={tenPercentage?.toFixed(1)}
      unit="%"
      note={`${tenCount} su ${arrowsCount}`}
    />

    <Precision
      label="Frecce"
      value={arrowsCount}
      unit=""
    />
  </div>
</div>


      {/* ANDAMENTO */}
      {firstHalfAvg != null && secondHalfAvg != null && (
        <div className="perfSection">
          <div className="sectionTitle">Andamento</div>

          <div className="trendRow">
            <div>
              <div className="trendLabel">Prime 10 volée</div>
              <div className="trendValue">
                {firstHalfAvg.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="trendLabel">Seconde 10 volée</div>
              <div className="trendValue">
                {secondHalfAvg.toFixed(2)}
              </div>
            </div>

            <div className="trendDelta" style={{ color: trendColor }}>
              {trendLabel}
            </div>
          </div>

          <div className="trendNote">{trendText}</div>
        </div>
      )}
    </div>
  );
}

/* ======================
   COMPONENTI UI
====================== */

function Highlight({ label, value, note }) {
  return (
    <div className="highlightBox">
      <div className="highlightLabel">{label}</div>
      <div className="highlightValue">{value ?? "—"}</div>
      <div className="highlightNote">{note}</div>
    </div>
  );
}

function Precision({ label, value, unit = "%", note }) {
  return (
    <div className="precisionBox">
      <div className="precisionValue">
        {value ?? "—"}
        {unit}
      </div>

      {note && (
        <div className="precisionNote">
          {note}
        </div>
      )}

      <div className="precisionLabel">{label}</div>
    </div>
  );
}

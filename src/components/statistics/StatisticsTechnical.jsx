import React from "react";
import SvgTargetInteractive from "../SvgTargetInteractive";

export default function StatisticsTechnical({
  technical,
  technicalBySpot,
  hits,
  interpretation
}) {
  // 1) normalizza hits SEMPRE, prima di ogni if
  const validHits = Array.isArray(hits)
    ? hits.filter((h) => h && Number.isFinite(h.x) && Number.isFinite(h.y))
    : [];

  // 2) detect trispot: basta che esista almeno un blocco spot (anche null/non null)
  const isTrispot =
    !!technicalBySpot &&
    (technicalBySpot.high || technicalBySpot.middle || technicalBySpot.low);

  /* =========================================================
     TRISPOT → layout dedicato (EARLY RETURN UNICO)
     - Qui NON mostriamo target unico né heatmap globale
     - Mostriamo solo i 3 box (alto/centrale/basso)
  ========================================================= */
  if (isTrispot) {
    return (
      <div className="card technicalCard">
        <div className="techHeader">
          <div className="techIcon">🎯</div>
          <div>
            <div className="title">Analisi tecnica – Trispot</div>
            <div className="subtitle">
              Confronto della rosata sui tre spot
            </div>
          </div>
        </div>

        <div className="techMetrics" style={{ gridTemplateColumns: "1fr" }}>
          <SpotBox label="Spot alto" data={technicalBySpot.high} />
          <SpotBox label="Spot centrale" data={technicalBySpot.middle} />
          <SpotBox label="Spot basso" data={technicalBySpot.low} />
        </div>

        {/* SUGGERIMENTO TECNICO */}
        {interpretation && (
          <div className="techAdvice">💡 {interpretation}</div>
        )}
      </div>
    );
  }

  /* =========================================================
     TARGET UNICO → fallback standard (non trispot)
  ========================================================= */

  // Se non è trispot e non ho dati, fallback
  if (!technical || validHits.length === 0) {
    return (
      <div className="card">
        <div className="title">Analisi tecnica</div>
        <div className="subtitle">Dati insufficienti per l’analisi</div>
      </div>
    );
  }

  const { meanX, meanY, dispersionRadius } = technical;

   // numeri safe per evitare crash con toFixed()
  const safeMeanX = Number.isFinite(meanX) ? meanX : 0;
  const safeMeanY = Number.isFinite(meanY) ? meanY : 0;
  const safeDispersion = Number.isFinite(dispersionRadius)
    ? dispersionRadius
    : null;

  // ===============================
// CENTRO MEDIO: SOGLIA + INTERPRETAZIONE
// ===============================

// soglia: sotto questo valore il centro è considerato allineato
const CENTER_THRESHOLD = 0.7; // mm reali (puoi rifinirla)

// distanza radiale del centro medio
const centerDistance = Math.sqrt(
  safeMeanX * safeMeanX + safeMeanY * safeMeanY
);

// centro allineato?
const isCenterAligned = centerDistance < CENTER_THRESHOLD;

// direzione testuale SOLO se fuori soglia
const centerDirection = !isCenterAligned
  ? Math.abs(safeMeanY) > Math.abs(safeMeanX)
    ? safeMeanY > 0
      ? "Deriva media verso l’alto"
      : "Deriva media verso il basso"
    : safeMeanX > 0
    ? "Deriva media a destra"
    : "Deriva media a sinistra"
  : null;


  // direction basato sui safe
  const direction =
    Math.abs(safeMeanY) > Math.abs(safeMeanX)
      ? safeMeanY > 0
        ? "Tendenza verso l’alto"
        : "Tendenza verso il basso"
      : safeMeanX > 0
      ? "Tendenza a destra"
      : "Tendenza a sinistra";

  // label dispersione basata su safeDispersion
  const dispersionLabel =
    safeDispersion == null
      ? "Dispersione non calcolabile"
      : safeDispersion < 25
      ? "Ottima compattezza"
      : safeDispersion < 45
      ? "Buona compattezza"
      : "Dispersione elevata";

  return (
    <div className="card technicalCard">
      {/* HEADER */}
      <div className="techHeader">
        <div className="techIcon">🎯</div>
        <div>
          <div className="title">Analisi tecnica</div>
          <div className="subtitle">Come colpisci il bersaglio in media</div>
        </div>
      </div>

      {/* METRICHE */}
      <div className="techMetrics">
        <TechBox
          label="Dispersione"
          value={safeDispersion != null ? `${safeDispersion.toFixed(0)} mm` : "—"}
          note={dispersionLabel}
        />

       <TechBox
        label="Centro medio"
        value={
            isCenterAligned
            ? "Allineato"
            : `X ${safeMeanX.toFixed(1)} / Y ${safeMeanY.toFixed(1)}`
        }
        note={
            isCenterAligned
            ? "Nessuna deriva significativa rispetto al centro"
            : centerDirection
        }
        /> 

      </div>

      {/* SUGGERIMENTO TECNICO */}
      {interpretation && (
        <div className="techAdvice">💡 {interpretation}</div>
      )}

      {/* TARGET CUMULATIVO */}
      <div className="techTarget">
        <div className="smallMuted" style={{ marginBottom: 6 }}>
          Distribuzione reale delle frecce
        </div>

        <SvgTargetInteractive
          mode="single"
          hits={validHits}
          readOnly
          pointsOnly
        />
      </div>

      {/* HEAT MAP */}
      <div className="techTarget" style={{ marginTop: 16 }}>
        <div className="smallMuted" style={{ marginBottom: 6 }}>
          Heat map (zone più colpite)
        </div>

        <SvgTargetInteractive mode="heatmap" hits={validHits} readOnly />
      </div>
    </div>
  );
}

/* ======================
   COMPONENTI UI
====================== */

function TechBox({ label, value, note }) {
  return (
    <div className="techBox">
      <div className="techLabel">{label}</div>
      <div className="techValue">{value}</div>
      <div className="techNote">{note}</div>
    </div>
  );
}

/**
 * IMPORTANTISSIMO:
 * computeTechnicalSummary (dispersion.js) restituisce:
 * - dispersionRadius
 * - meanX
 * - meanY
 * NON restituisce "dispersion" o "meanPoint".
 */

function SpotBox({ label, data }) {
  const hasData =
    data &&
    Number.isFinite(data.dispersionRadius) &&
    Number.isFinite(data.spreadX) &&
    Number.isFinite(data.spreadY);

  if (!hasData) {
    return (
      <div className="techBox">
        <div className="techLabel">{label}</div>
        <div className="techValue">—</div>
        <div className="techNote">Dati insufficienti</div>
      </div>
    );
  }

  return (
    <div className="techBox">
      <div className="techLabel">{label}</div>

      <div className="techValue">
        {data.dispersionRadius.toFixed(0)} mm
      </div>

      <div className="techNote">
        Dispersione verticale: {data.spreadY.toFixed(1)} mm<br />
        Dispersione orizzontale: {data.spreadX.toFixed(1)} mm
      </div>
    </div>
  );
}
import React, { useMemo, useState, useEffect } from "react";

import StatisticsSummary from "./StatisticsSummary";
import StatisticsTechnical from "./StatisticsTechnical";

import { computeSessionSummary } from "../../utils/statistics/aggregates";
import { computeTechnicalSummary } from "../../utils/statistics/dispersion";
import { interpretGrouping } from "../../utils/statistics/interpretation";
import { interpretTrispot } from "../../utils/statistics/interpretation";
import { interpretCenterMean } from "../../utils/statistics/interpretation";

import { compareCompetitionVsTraining } from "../../utils/statistics/comparisons";


export default function StatisticsScreen({
  sessions = [],
  currentSession,
  onBack,
  onHome
}) {

      /* ----------------------
     CONTESTO ANALISI (LIVELLO 2)
  ---------------------- */
  const analysisContext = useMemo(() => {
    if (!sessions.length) return null;

    const unique = (arr) => [...new Set(arr.filter(v => v != null))];
    const singleOrMixed = (values, label) =>
      values.length === 1 ? values[0] : `${label} misto`;

    const kinds = unique(sessions.map(s => s.kind));
    const distances = unique(sessions.map(s => s.distance));
    const environments = unique(sessions.map(s => s.environment));
    const targets = unique(sessions.map(s => s.targetType));

    return {
      count: sessions.length,
      kind: singleOrMixed(kinds, "Tipologia"),
      distance: singleOrMixed(distances, "Distanza"),
      environment: singleOrMixed(environments, "Ambiente"),
      target: singleOrMixed(targets, "Bersaglio")
    };
  }, [sessions]);


      // 🔍 DEBUG INGRESSO STATISTICHE
  console.log("📊 StatisticsScreen - sessions ricevute:", sessions);

  sessions.forEach((s, i) => {
    console.log(
      `SESSION ${i}`,
      "id:", s?._id,
      "volleys:",
      Array.isArray(s?.volleys) ? s.volleys.length : s?.volleys
    );
  });


  /* ----------------------
     NORMALIZZAZIONE (CRITICA)
  ---------------------- */
  const normalizedSessions = useMemo(() => {
  return sessions.map((session) => ({
    ...session,
    volleys: Array.isArray(session.volleys)
      ? session.volleys.map((v) => ({
          arrows: Array.isArray(v.arrows)
            ? [v.arrows[0] ?? null, v.arrows[1] ?? null, v.arrows[2] ?? null]
            : [null, null, null],
          hits: Array.isArray(v.hits)
            ? [v.hits[0] ?? null, v.hits[1] ?? null, v.hits[2] ?? null]
            : [null, null, null],
          total: Number.isFinite(v.total) ? v.total : 0
        }))
      : []
  }));
}, [sessions]);

  /* ----------------------
   MEDIA PER SESSIONE (SPORTIVA)
---------------------- */
const averagePerSession = useMemo(() => {
  if (!normalizedSessions.length) return null;

  const sessionAverages = normalizedSessions
    .map((session) => {
      const arrows = session.volleys.flatMap(v => v.arrows).filter(a => a != null);
      if (!arrows.length) return null;

      const totalScore = arrows.reduce((s, a) => s + a, 0);
      const volleysCount = Math.floor(arrows.length / 3);
      if (volleysCount === 0) return null;

      return totalScore / volleysCount;
    })
    .filter(v => v != null);

  if (!sessionAverages.length) return null;

  return sessionAverages.reduce((a, b) => a + b, 0) / sessionAverages.length;
}, [normalizedSessions]);

  /* ----------------------
     ARROWS & HITS
  ---------------------- */
  const arrows = useMemo(() => {
    return normalizedSessions.flatMap((session) =>
      session.volleys.flatMap((v, volleyIndex) =>
        v.arrows.map((score, i) => {
          const hit = v.hits[i];
          return score != null
            ? {
                score,
                isX: hit?.isX === true,
                volleyIndex
              }
            : null;
        })
      )
    ).filter(Boolean);
  }, [normalizedSessions]);

  /* ----------------------
   HITS (COMPATIBILE VECCHI + NUOVI)
---------------------- */
const hits = useMemo(() => {
  return normalizedSessions.flatMap((session) =>
    session.volleys.flatMap((v) =>
      (v.hits || [])
        .map((h) => {
          if (!h) return null;

          // nuovo formato
          if (
            Number.isFinite(h.xNorm) &&
            Number.isFinite(h.yNorm)
          ) {
            return { x: h.xNorm, y: h.yNorm };
          }

          // formato legacy
          if (
            Number.isFinite(h.x) &&
            Number.isFinite(h.y)
          ) {
            return { x: h.x, y: h.y };
          }

          return null;
        })
        .filter(Boolean)
    )
  );
}, [normalizedSessions]);

/* ----------------------
   TRISPOT: HITS PER SPOT
---------------------- */
const hitsBySpot = useMemo(() => {
  const grouped = {
    high: [],
    middle: [],
    low: []
  };

  normalizedSessions.forEach((session) => {
    session.volleys.forEach((v) => {
      if (!Array.isArray(v.hits)) return;

      v.hits.forEach((h, index) => {
        if (!h) return;

        const x =
          Number.isFinite(h.xNorm) ? h.xNorm :
          Number.isFinite(h.x) ? h.x :
          null;

        const y =
          Number.isFinite(h.yNorm) ? h.yNorm :
          Number.isFinite(h.y) ? h.y :
          null;

        if (x == null || y == null) return;

        if (index === 0) grouped.high.push({ x, y });
        if (index === 1) grouped.middle.push({ x, y });
        if (index === 2) grouped.low.push({ x, y });
      });
    });
  });

  return grouped;
}, [normalizedSessions]);

console.log("TRISPOT CHECK");
console.log("HIGH first hit:", hitsBySpot.high[0]);
console.log("MIDDLE first hit:", hitsBySpot.middle[0]);
console.log("LOW first hit:", hitsBySpot.low[0]);


useEffect(() => {
  console.log("🎯 DEBUG TRISPOT");
  console.log("HIGH hits:", hitsBySpot.high.length, hitsBySpot.high);
  console.log("MIDDLE hits:", hitsBySpot.middle.length, hitsBySpot.middle);
  console.log("LOW hits:", hitsBySpot.low.length, hitsBySpot.low);
}, [hitsBySpot]);

const isTrispotSelected = sessions.some(
  (s) => s.targetType === "Trispot"
);


  /* ----------------------
     CALCOLI
  ---------------------- */
  const summary = useMemo(
    () => computeSessionSummary(arrows),
    [arrows]
  );

  const technical = useMemo(
    () => computeTechnicalSummary(hits),
    [hits]
  );

  /* ----------------------
   CONFRONTO GARA vs ALLENAMENTO
   (18 m – Target 40 cm)
---------------------- */
const competitionVsTraining = useMemo(() => {
  return compareCompetitionVsTraining(sessions, {
    distance: 18,
    targetType: "40cm"
  });
}, [sessions]);


  const centerMeanInterpretation = useMemo(() => {
  return interpretCenterMean(technical);
}, [technical]);


 const technicalBySpot = useMemo(() => {
  if (!isTrispotSelected) return null;

  return {
    high: computeTechnicalSummary(hitsBySpot.high),
    middle: computeTechnicalSummary(hitsBySpot.middle),
    low: computeTechnicalSummary(hitsBySpot.low)
  };
}, [hitsBySpot, isTrispotSelected]);

    const trispotAdvice = useMemo(
    () => interpretTrispot(technicalBySpot),
    [technicalBySpot]
    );

   const interpretation = useMemo(() => {
  // PRIORITÀ AL TRISPOT
  if (
    technicalBySpot?.high ||
    technicalBySpot?.middle ||
    technicalBySpot?.low
  ) {
    return interpretTrispot(technicalBySpot);
  }

  if (!technical) return null;
  return interpretGrouping(technical);
}, [technical, technicalBySpot]);

  /* ----------------------
     NO DATA
  ---------------------- */
  if (normalizedSessions.length === 0) {
    return (
      <div className="page">
        <div className="topBar">
          <button className="ghost" onClick={onBack}>←</button>
          <button className="ghost" onClick={onHome} title="Home">🏠</button>
          <div className="topBarCenter">
            <div className="title">Statistiche</div>
            <div className="subtitle">Nessun dato disponibile</div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------
     RENDER
  ---------------------- */
  return (
    <div className="page">
      <div className="topBar">
        <button className="ghost" onClick={onBack}>←</button>
        <div className="topBarCenter">
          <div className="title">Statistiche</div>
          <div className="subtitle">
            {analysisContext && (
                <>
                {analysisContext.count} sessioni ·{" "}
                {analysisContext.kind} ·{" "}
                {analysisContext.distance} m ·{" "}
                {analysisContext.environment} ·{" "}
                {analysisContext.target}
                </>
            )}
            </div>
        </div>
      </div>

      <StatisticsSummary 
      summary={summary} 
      averagePerSession={averagePerSession}
      />

{competitionVsTraining &&
 competitionVsTraining.trainingAvg != null &&
 competitionVsTraining.competitionAvg != null && (
  <div className="card">
    <div className="title">Confronto gara vs allenamento</div>
    <div className="subtitle">
      18 m · Target 40 cm
    </div>

    <div className="row" style={{ marginTop: 12 }}>
      <div>
        <strong>Allenamento</strong><br />
        {competitionVsTraining.trainingAvg.toFixed(1)} pt / volée
        <div className="smallMuted">
          {competitionVsTraining.sessionsCount.training} sessioni
        </div>
      </div>

      <div>
        <strong>Gara</strong><br />
        {competitionVsTraining.competitionAvg.toFixed(1)} pt / volée
        <div className="smallMuted">
          {competitionVsTraining.sessionsCount.competition} sessioni
        </div>
      </div>

      <div>
        <strong>Δ</strong><br />
        <span
          style={{
            color:
              competitionVsTraining.delta < 0
                ? "#DC2626"
                : "#059669"
          }}
        >
          {competitionVsTraining.delta.toFixed(2)} pt
        </span>
      </div>
    </div>
  </div>
)}

      <StatisticsTechnical
        technical={technical}
        technicalBySpot={technicalBySpot}
        hits={hits}
        interpretation={interpretation}
        />
      
      <div style={{ height: 28 }} />
    </div>
  );
}

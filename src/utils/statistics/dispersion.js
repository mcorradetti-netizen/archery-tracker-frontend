/* =========================
   SPATIAL ANALYSIS
========================= */

/* Centro medio del gruppo */
export function meanPoint(hits = []) {
  if (!hits.length) return null;

  const sum = hits.reduce(
    (acc, h) => {
      acc.x += h.x;
      acc.y += h.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / hits.length,
    y: sum.y / hits.length
  };
}

/* Distanza euclidea */
function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/* Dispersione radiale RMS (in mm) */
export function radialDispersion(hits = []) {
  if (hits.length < 2) return null;

  const center = meanPoint(hits);

  // conversione: coordinate normalizzate → mm
  const TARGET_DIAMETER_MM = 500;

  const distances = hits.map(h => {
    const dx = (h.x - center.x) * TARGET_DIAMETER_MM;
    const dy = (h.y - center.y) * TARGET_DIAMETER_MM;
    return Math.sqrt(dx * dx + dy * dy);
  });

  const meanSquare =
    distances.reduce((sum, d) => sum + d * d, 0) / distances.length;

  return Math.sqrt(meanSquare);
}

/* =========================
   TECHNICAL SUMMARY
========================= */

export function computeTechnicalSummary(hits = []) {
  if (hits.length < 2) return null;

  const center = meanPoint(hits);

  const dx = hits.map(h => h.x - center.x);
  const dy = hits.map(h => h.y - center.y);

  const spreadX =
    Math.sqrt(dx.reduce((s, v) => s + v * v, 0) / dx.length);

  const spreadY =
    Math.sqrt(dy.reduce((s, v) => s + v * v, 0) / dy.length);

  return {
    arrowsCount: hits.length,
    meanX: center.x,
    meanY: center.y,
    dispersionRadius: radialDispersion(hits),
    spreadX,
    spreadY
  };
}

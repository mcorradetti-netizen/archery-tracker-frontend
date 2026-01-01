/* =========================
   AGGREGATE STATISTICS
========================= */

/* Media */
export function mean(values = []) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/* Deviazione standard */
export function standardDeviation(values = []) {
  if (values.length < 2) return null;
  const avg = mean(values);
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}

/* Percentuale con condizione */
export function percentage(items = [], predicate) {
  if (!items.length) return null;
  const count = items.filter(predicate).length;
  return (count / items.length) * 100;
}

/* =========================
   SESSION SUMMARY
========================= */

export function computeSessionSummary(arrows = []) {
  if (!arrows.length) return null;

  const scores = arrows.map(a => a.score);

  // ---- MEDIA SPORTIVA (PER VOLÉE) ----
// ogni volée è composta da 3 frecce
const ARROWS_PER_VOLLEY = 3;

// ricaviamo il numero reale di volée presenti
const totalVolleys = Math.floor(arrows.length / ARROWS_PER_VOLLEY);

// somma totale dei punteggi
const totalScore = scores.reduce((a, b) => a + b, 0);

// media per volée (30 = tutte X/10)
const averagePerVolley =
  totalVolleys > 0
    ? totalScore / totalVolleys
    : null;

  const firstHalf = arrows.filter(a => a.volleyIndex < 10);
  const secondHalf = arrows.filter(a => a.volleyIndex >= 10);
  const xCount = arrows.filter(a => a.isX === true).length;
  const tenCount = arrows.filter(a => a.score === 10).length;


  return {
  arrowsCount: arrows.length,

  totalVolleys,
  averagePerVolley,

  xCount,
  tenCount,

  averageScore: mean(scores),
  stdDeviation: standardDeviation(scores),

  xPercentage: arrows.length
    ? (xCount / arrows.length) * 100
    : null,

  tenPercentage: arrows.length
    ? (tenCount / arrows.length) * 100
    : null,

  firstHalfAvg: firstHalf.length
    ? mean(firstHalf.map(a => a.score))
    : null,

  secondHalfAvg: secondHalf.length
    ? mean(secondHalf.map(a => a.score))
    : null
};
}

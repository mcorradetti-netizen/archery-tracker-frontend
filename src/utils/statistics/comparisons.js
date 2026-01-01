/* =========================
   COMPARISONS
========================= */

/**
 * Confronto Gara vs Allenamento
 * Default: 18m – Target 40cm
 */
export function compareCompetitionVsTraining(
  sessions = [],
  options = {}
) {
  const {
    distance = 18,
    targetType = "40cm"
  } = options;

  // filtro condizioni equivalenti
  const filtered = sessions.filter(s =>
    Number(String(s.distance).replace(/[^\d]/g, "")) === distance &&
    String(s.targetType).replace(/\s+/g, "").toLowerCase() ===
String(targetType).replace(/\s+/g, "").toLowerCase() &&
    (s.kind === "Competizione" || s.kind === "Allenamento")
  );

  function averagePerVolley(session) {
    const volleys = session.volleys || [];
    if (!volleys.length) return null;

    const totals = volleys.map(v => v.total).filter(Number.isFinite);
    if (!totals.length) return null;

    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }

  const training = [];
  const competition = [];

  filtered.forEach(s => {
    const avg = averagePerVolley(s);
    if (avg == null) return;

    if (s.kind === "Allenamento") training.push(avg);
    if (s.kind === "Competizione") competition.push(avg);
  });

  const mean = arr =>
    arr.length
      ? arr.reduce((a, b) => a + b, 0) / arr.length
      : null;

  const trainingAvg = mean(training);
  const competitionAvg = mean(competition);

  return {
    distance,
    targetType,
    trainingAvg,
    competitionAvg,
    delta:
      trainingAvg != null && competitionAvg != null
        ? competitionAvg - trainingAvg
        : null,
    sessionsCount: {
      training: training.length,
      competition: competition.length
    }
  };
}

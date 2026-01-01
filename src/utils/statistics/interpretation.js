export function interpretGrouping({
  dispersion,
  meanX,
  meanY,
  spreadX,
  spreadY
}) {
  if (dispersion < 25) return "Rosata molto compatta, ottima stabilità.";

  if (spreadY > spreadX * 1.3)
    return "Dispersione verticale: controlla trazione e allungo.";

  if (spreadX > spreadY * 1.3)
    return "Dispersione orizzontale: verifica grip e center shot.";

  return "Rosata ampia ma regolare: lavora sulla continuità del rilascio.";
}

export function interpretTrispot(technicalBySpot) {
  if (!technicalBySpot) return null;

  const spots = ["high", "middle", "low"]
    .map((key) => ({
      key,
      ...technicalBySpot[key]
    }))
    .filter(s => s && s.count >= 6 && Number.isFinite(s.dispersion));

  if (spots.length < 2) return null;

  spots.sort((a, b) => a.dispersion - b.dispersion);

  const best = spots[0];
  const worst = spots[spots.length - 1];

  if (worst.dispersion - best.dispersion < 10) {
    return "Rosata uniforme sui tre spot: buona gestione dell’angolo di tiro.";
  }

  const spotLabel = {
    high: "alto",
    middle: "medio",
    low: "basso"
  };

  if (worst.key === "low") {
    return "Lo spot basso è meno compatto: possibile stanchezza o perdita di controllo nell’angolo discendente.";
  }

  if (worst.key === "high") {
    return "Lo spot alto mostra maggiore dispersione: verifica riferimento visivo e allineamento iniziale.";
  }

  return "Lo spot centrale è meno stabile: possibile incoerenza nella fase di rilascio.";
}

/* =========================
   CENTER MEAN INTERPRETATION
========================= */

export function interpretCenterMean(technical, options = {}) {
  if (!technical) return null;

  const {
    meanX,
    meanY,
    dispersion
  } = technical;

  // soglia in coordinate normalizzate
  // (regola: sotto questa soglia è "centrato")
  const THRESHOLD = options.threshold ?? 0.05;

  if (
    Math.abs(meanX) < THRESHOLD &&
    Math.abs(meanY) < THRESHOLD
  ) {
    return {
      type: "centered",
      label: "Centro medio allineato",
      description: "Nessuna deriva significativa rispetto al centro."
    };
  }

  // direzione prevalente
  const horiz =
    meanX > THRESHOLD ? "destra" :
    meanX < -THRESHOLD ? "sinistra" :
    null;

  const vert =
    meanY > THRESHOLD ? "alto" :
    meanY < -THRESHOLD ? "basso" :
    null;

  const direction =
    horiz && vert ? `${vert}-${horiz}` :
    horiz || vert;

  return {
    type: "offset",
    label: `Deriva media ${direction}`,
    description: "Spostamento sistematico del gruppo rispetto al centro.",
    value: { x: meanX, y: meanY }
  };
}


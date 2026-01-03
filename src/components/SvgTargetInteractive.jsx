import React, { useMemo, useRef, useState } from "react";

/* =======================
   UTILITÀ COLORI
======================= */
function scoreToColor(score) {
  if (score >= 9) return "#FFD200";
  if (score >= 7) return "#D00000";
  if (score >= 5) return "#1E5AA8";
  if (score >= 3) return "#111111";
  return "#FFFFFF";
}

/* =======================
   TARGET SINGOLO + LENTE
======================= */
function SingleTarget({ onHit, minScore = 1, hits = [], readOnly = false, pointsOnly = false}) {
  const svgRef = useRef(null);
  const [lens, setLens] = useState(null);

  const outerR = 250;
  const band = outerR / 10;
  const INNER_10_R = 12.5;

  const rings = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const score = 1 + i;
      if (score < minScore) return null;
      const r = outerR - i * band;
      return { score, r, color: scoreToColor(score) };
    }).filter(Boolean);
  }, [minScore]);

  function clientPointToSvg(evt) {
    const svg = svgRef.current;
    if (!svg) return null;

    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    return pt.matrixTransform(ctm.inverse());
  }

  function handlePointerDown(evt, score) {
    if (readOnly) return;
    if (!onHit) return; // ✅ se non armato, non inserire nulla

    evt.preventDefault();
    evt.stopPropagation();

    const p = clientPointToSvg(evt);
    if (!p) return;

    const dx = p.x - outerR;
    const dy = p.y - outerR;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isX = dist <= INNER_10_R;

    setLens({ x: p.x, y: p.y });

    onHit?.({
      score,
      xNorm: p.x / (outerR * 2),
      yNorm: p.y / (outerR * 2),
      isX
    });

    setTimeout(() => setLens(null), 120);
  }

  function handlePointerMove(evt) {
    if (!lens) return;
    const p = clientPointToSvg(evt);
    if (!p) return;
    setLens((l) => ({ ...l, x: p.x, y: p.y }));
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox="0 0 500 500"
      className="target"
      style={{ touchAction: "manipulation", maxHeight: 300 }}
      onPointerMove={handlePointerMove}
    >
      {rings.map((ring) => (
        <circle
          key={ring.score}
          cx={outerR}
          cy={outerR}
          r={ring.r}
          fill={ring.color}
          stroke="#000"
          strokeWidth="1"
          onPointerDown={(e) => handlePointerDown(e, ring.score)}
        />
      ))}

      {minScore === 1 && (
        <circle
          cx={outerR}
          cy={outerR}
          r={outerR - band * 3}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          opacity="0.75"
          pointerEvents="none"
        />
      )}

      {(hits || [])
  .filter(h => h && Number.isFinite(h.x) && Number.isFinite(h.y))
  .map((h, i) => (
    <circle
      key={i}
      cx={h.x * 500}
      cy={h.y * 500}
      r={pointsOnly ? 3 : readOnly ? 14 : 3}
      fill={
        pointsOnly
          ? "#111827" // puntino scuro
          : readOnly
          ? "rgba(16, 185, 129, 0.18)" // heatmap
          : "#FFF"
      }
      stroke={
        pointsOnly
          ? "none"
          : readOnly
          ? "none"
          : "#9CA3AF"
      }
      strokeWidth={pointsOnly ? 0 : readOnly ? 0 : 2}
      pointerEvents="none"
    />
))}


      {lens && (
        <circle
          cx={lens.x}
          cy={lens.y}
          r="45"
          fill="none"
          stroke="#111827"
          strokeWidth="2"
          pointerEvents="none"
        />
      )}

      <circle
        cx={outerR}
        cy={outerR}
        r={INNER_10_R}
        fill="none"
        stroke="#000"
        strokeWidth="1"
        pointerEvents="none"
      />
    </svg>
  );
}

/* =======================
   COMPONENTE PRINCIPALE
======================= */
export default function SvgTargetInteractive({
  mode = "single",
  onHit,
  activeIndex = 0,
  hits = [],
  readOnly = false,
  pointsOnly = false   // 👈 AGGIUNTO
}) {

  if (mode !== "trispot") {
    return (
  <SingleTarget
    onHit={onHit}
    minScore={1}
    hits={hits}
    readOnly={readOnly}
    pointsOnly={pointsOnly}   // 👈 AGGIUNTO
  />
);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420, margin: "0 auto" }}>
      {[0, 1, 2].map((i) => {
        const isActive = i === activeIndex;
        return (
          <div
            key={i}
            style={{
              transform: isActive ? "scale(1.38)" : "scale(0.78)",
              transition: "transform 200ms ease, opacity 200ms ease",
              opacity: isActive ? 1 : 0.35
            }}
          >
            <SingleTarget
              onHit={onHit}
              minScore={6}
              hits={hits[i] ? [hits[i]] : []}
              readOnly={readOnly}
              pointsOnly={pointsOnly}
            />
          </div>
        );
      })}
    </div>
  );
}

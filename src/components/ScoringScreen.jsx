import React, { useMemo, useState, useEffect } from "react";
import SvgTargetInteractive from "./SvgTargetInteractive";
import SessionForm from "./SessionForm";

function sum(arr) {
  return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function scoreStyle(score) {
  if (score >= 9) return { bg: "#FFD200", color: "#000" }; // giallo
  if (score >= 7) return { bg: "#D00000", color: "#FFF" }; // rosso
  if (score >= 5) return { bg: "#1E5AA8", color: "#FFF" }; // blu
  if (score >= 3) return { bg: "#111111", color: "#FFF" }; // nero
  return { bg: "#FFFFFF", color: "#000" };                // bianco
}

function makeEmptySession(base = {}) {
  return {
    ...base,
    volleys: Array.from({ length: 20 }, () => ({
      arrows: [null, null, null],
      total: 0,
      hits: [null, null, null]
    }))
  };
}

export default function ScoringScreen({ session, onBack, onHome, onSave, onOpenStatistics }) {
  // ✅ evita render con local undefined (causa principale schermo bianco)
  const [local, setLocal] = useState(() => (session ? makeEmptySession(session) : makeEmptySession()));
  const [cursor, setCursor] = useState({ volley: 0, arrow: 0 });
  const [editing, setEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showCumulativeTarget, setShowCumulativeTarget] = useState(false);
  // 🔴 TRISPOT FLAG
const isTrispot = local?.targetType === "Trispot";


  // ✅ normalizza qualsiasi sessione (vecchia o nuova) appena arriva
  useEffect(() => {
    if (!session) {
      setLocal(makeEmptySession());
      return;
    }

    const normalized = {
      ...makeEmptySession(session),
      ...session,
      volleys: Array.from({ length: 20 }, (_, i) => {
        const v = session.volleys?.[i] || {};
        const arrows = Array.isArray(v.arrows) ? v.arrows : [null, null, null];
        const hitsArr = Array.isArray(v.hits) ? v.hits : [];

        // hits: supporta x/y oppure xNorm/yNorm e garantisce 3 slot
        const hits = [0, 1, 2].map((k) => {
          const h = hitsArr[k];
          if (!h) return null;

          const x = Number.isFinite(h.x) ? h.x : h.xNorm;
          const y = Number.isFinite(h.y) ? h.y : h.yNorm;

          return {
            x: Number.isFinite(x) ? x : null,
            y: Number.isFinite(y) ? y : null,

            // 🔴 QUESTA È LA CHIAVE
            // se il backend non rimanda isX,
            // ma il punteggio è 10, NON distruggiamo la X
            isX: h.isX === true
          };
        });

        return {
          ...v,
          arrows: [arrows[0] ?? null, arrows[1] ?? null, arrows[2] ?? null],
          hits,
          total: Number.isFinite(v.total) ? v.total : sum(arrows)
        };
      })
    };

    setLocal(normalized);

    // (opzionale ma utile) se apri una sessione, riparti dalla prima volée non completa
    // commenta se non lo vuoi
    // const firstIncomplete = normalized.volleys.findIndex(v => (v.arrows || []).some(a => a == null));
    // if (firstIncomplete >= 0) setCursor({ volley: firstIncomplete, arrow: 0 });
  }, [session]);

  // ✅ total robusto (mai crash)
  const total = useMemo(() => {
    const vols = local?.volleys || [];
    return sum(vols.map((v) => v.total || 0));
  }, [local]);

  // ✅ allHits robusto (per heatmap)
  const allHits = useMemo(() => {
    const vols = local?.volleys || [];
    return vols.flatMap(v => (Array.isArray(v.hits) ? v.hits : [])).filter(Boolean);
  }, [local]);
  
  // ✅ sessione completata: ultima volée compilata
  const isSessionComplete =
    Array.isArray(local?.volleys) &&
    local.volleys.length === 20 &&
    local.volleys.every(v =>
      Array.isArray(v.arrows) && v.arrows.every(a => a != null)
    );

  const currentVolley =
    local?.volleys?.[cursor.volley] || { arrows: [null, null, null], hits: [null, null, null], total: 0 };

  /* ======================
     AUTO SAVE (IMPORTANT)
     ====================== */
  useEffect(() => {
    if (!local?._id) return;

    const t = setTimeout(() => {
      onSave(local);
    }, 500);

    return () => clearTimeout(t);
  }, [local, onSave]);

  /* ======================
     EDIT MODE (SESSION)
     ====================== */
  if (editing) {
    return (
      <SessionForm
        initialData={local}
        onCreate={async (updated) => {
          const saved = await onSave({
            ...local,
            ...updated
          });

          setLocal(saved ? makeEmptySession(saved) : makeEmptySession(local));
          setEditing(false);
        }}
      />
    );
  }

  /* ======================
     HEAT MAP VIEW
     ====================== */
    if (showHeatmap && !isTrispot) {
    return (
      <div className="page">
        <div className="topBar">
          <button className="ghost" onClick={() => setShowHeatmap(false)}>←</button>

          <div className="topBarCenter">
            <div className="title">Heat map sessione</div>
            <div className="subtitle">Totale frecce: {allHits.length}</div>
          </div>

          <div style={{ width: 44 }} />
        </div>

        <div className="card">
          <SvgTargetInteractive
            mode="single"
            hits={allHits}
            readOnly
          />
        </div>
      </div>
    );
  }

/* ======================
   CUMULATIVE TARGET VIEW
   ====================== */
if (showCumulativeTarget && !isTrispot) {
  return (
    <div className="page">
      <div className="topBar">
        <button className="ghost" onClick={() => setShowCumulativeTarget(false)}>
          ←
        </button>

        <div className="topBarCenter">
          <div className="title">Target cumulativo</div>
          <div className="subtitle">
            Totale frecce: {allHits.length}
          </div>
        </div>

        <div style={{ width: 44 }} />
      </div>

      <div className="card">
        <SvgTargetInteractive
          mode={local.targetType === "Trispot" ? "trispot" : "single"}
          hits={allHits}
          readOnly
          pointsOnly
        />
      </div>
    </div>
  );
}

  /* ======================
     SCORING LOGIC
     ====================== */
  function setArrow(score, hit) {
    const vIdx = cursor.volley;
    const aIdx = cursor.arrow;

    const next = structuredClone(local);
    if (!Array.isArray(next.volleys)) next.volleys = makeEmptySession().volleys;
    if (!next.volleys[vIdx]) next.volleys[vIdx] = { arrows: [null, null, null], hits: [null, null, null], total: 0 };

    const volley = next.volleys[vIdx];
    if (!Array.isArray(volley.arrows)) volley.arrows = [null, null, null];
    if (!Array.isArray(volley.hits)) volley.hits = [null, null, null];

        // ✅ arrows: SEMPRE numeri (MAI "X")
      volley.arrows[aIdx] = score;

      // ✅ HIT CON COORDINATE (tap sul target)
      if (hit && Number.isFinite(hit.xNorm) && Number.isFinite(hit.yNorm)) {
        volley.hits[aIdx] = {
          x: hit.xNorm,
          y: hit.yNorm,
          isX: !!hit.isX
        };

      // ✅ HIT X DA INSERIMENTO RAPIDO
      } else if (hit && hit.isX) {
        volley.hits[aIdx] = {
          x: null,
          y: null,
          isX: true
        };

      // ✅ M o inserimenti senza hit
      } else {
        volley.hits[aIdx] = null;
      }


        volley.total = sum(
      volley.arrows.map(a => (a === "X" ? 10 : a))
    );

    // advance cursor
    const nextArrow = aIdx + 1;
    if (nextArrow < 3) {
      setCursor({ volley: vIdx, arrow: nextArrow });
    } else {
      const nextVolley = clamp(vIdx + 1, 0, 19);
      setCursor({ volley: nextVolley, arrow: 0 });
    }

    setLocal(next);
  }

  function onHit({ score, xNorm, yNorm, isX }) {
    setArrow(score, { xNorm, yNorm, isX });
  }

  function quick(score, isX = false) {
    setArrow(score, isX ? { isX: true } : null);
  }

  /* ======================
     RENDER
     ====================== */
  // ✅ ultima protezione: se qualcosa arriva malformato, non crasha
  if (!local || !Array.isArray(local.volleys)) {
    return (
      <div className="page">
        <div className="card">
          <div className="title">Caricamento sessione…</div>
          <div className="subtitle">Se resta vuoto, c’è un errore nei dati salvati o nell’API.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* TOP BAR */}
      <div className="topBar">
        <button className="ghost" onClick={onBack}>←</button>
        <button className="ghost" onClick={onHome} title="Home">🏠</button>

        <div className="topBarCenter">
          <div className="title">
            {local.name?.trim() ? local.name : "Sessione"}
          </div>
          <div className="subtitle">
            Volée {cursor.volley + 1}/20 • Freccia {cursor.arrow + 1}/3 • Totale: {total}
          </div>
        </div>

        {/* MENU ⋯ */}
        <div style={{ position: "relative" }}>
          <button className="ghost" onClick={() => setShowMenu(v => !v)}>⋯</button>

          {showMenu && (
            <div
              className="card"
              style={{
                position: "absolute",
                right: 0,
                top: 36,
                zIndex: 10,
                padding: 8
              }}
            >
              <button
                className="ghost"
                onClick={() => {
                  setEditing(true);
                  setShowMenu(false);
                }}
              >
                ✏️ Modifica sessione
              </button>

              {!isTrispot && (
              <button
                className="ghost"
                onClick={() => {
                  setShowHeatmap(true);
                  setShowMenu(false);
                }}
              >
                📊 Heat map
              </button>
            )}

              <button
                className="ghost"
                onClick={() => {
                  onOpenStatistics?.();
                  setShowMenu(false);
                }}
              >
                📈 Statistiche sessione
              </button>

              {isSessionComplete && !isTrispot && (
              <button
                className="ghost"
                onClick={() => {
                  setShowCumulativeTarget(true);
                  setShowMenu(false);
                }}
              >
                🎯 Target cumulativo
              </button>
            )}

              <div className="smallMuted" style={{ padding: "4px 8px" }}>
                ✔ Salvataggio automatico
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SESSION INFO */}
      <div className="card">
        <div className="row">
          <span className="pill">{local.kind}</span>
          <span className="pill">{local.environment}</span>
          <span className="pill">{local.targetType}</span>
          <span className="pill">{local.distance}m</span>
        </div>
      </div>

      {/* TARGET */}
      <SvgTargetInteractive
        mode={local.targetType === "Trispot" ? "trispot" : "single"}
        onHit={onHit}
        activeIndex={cursor.arrow}
        hits={currentVolley.hits || []}
      />

      {/* QUICK INPUT */}
      <div className="card">
        <div className="title">Inserimento rapido</div>
        <div className="subtitle">
          Se preferisci, puoi usare questi pulsanti invece del tap sul bersaglio.
        </div>

        <div className="quickGrid">
        {/* X */}
        <button
          className="quick"
          style={{
            backgroundColor: "#FFD200",
            color: "#000",
            border: "1px solid #9CA3AF"
          }}
          onClick={() => quick(10, true)}
        >
          X
        </button>

        {/* 10 → 1 */}
        {[10,9,8,7,6,5,4,3,2,1].map((n) => {
          const { bg, color } = scoreStyle(n);

          return (
            <button
              key={n}
              className="quick"
              style={{
                backgroundColor: bg,
                color,
                border: "1px solid #9CA3AF"
              }}
              onClick={() => quick(n)}
            >
              {n}
            </button>
          );
        })}

        {/* M */}
        <button
          className="quick"
          style={{
            backgroundColor: "#E5E7EB",
            color: "#111827",
            border: "1px solid #9CA3AF"
          }}
          onClick={() => quick(0)}
        >
          M
        </button>
      </div>

      </div>

      {/* CURRENT VOLLEY */}
      <div className="card">
        <div className="title">
          Volée corrente{" "}
          <span style={{ color: "#6B7280", fontWeight: 500 }}>
            ({cursor.volley + 1}/20)
          </span>
        </div>

        <div className="volleyRow">
          {currentVolley.arrows.map((a, i) => (
            <div
              key={i}
              className={
                "arrowCell " +
                (i === cursor.arrow ? "active" : "") +
                (a != null ? " editable" : "")
              }
              onClick={() => setCursor({ volley: cursor.volley, arrow: i })}
            >
              <div className="arrowLabel">F{i + 1}</div>
              <div className="arrowValue">
                {a == null ? "—" : currentVolley.hits?.[i]?.isX ? "X" : a}
              </div>

            </div>
          ))}

          <div className="arrowCell total">
            <div className="arrowLabel">Tot</div>
            <div className="arrowValue">{currentVolley.total ?? 0}</div>
          </div>
        </div>
      </div>

      {/* SCORECARD */}
      <div className="card">
        <div className="title">Scorecard</div>
        <div className="scorecard">
          {local.volleys.map((v, idx) => (
            <button
              key={idx}
              className={"scoreRow " + (idx === cursor.volley ? "current" : "")}
              onClick={() =>
                setCursor({
                  volley: idx,
                  arrow: clamp(
                    v.arrows.findIndex(x => x == null) !== -1
                      ? v.arrows.findIndex(x => x == null)
                      : 0,
                    0,
                    2
                  )
                })
              }
            >
              <div className="scoreIdx">{idx + 1}</div>

              <div className="scoreArrows">
  
  {v.arrows.map((a, i) => {
  const hit = v.hits?.[i];
  const isX = hit?.isX === true;

  // 👉 cosa mostrare
  const display =
    a == null
      ? "—"
      : isX
      ? "X"
      : a;

  // 👉 stile: basato SEMPRE sul punteggio numerico
  const style =
    a == null
      ? {}
      : (() => {
          const { bg, color } = scoreStyle(a);
          return {
            backgroundColor: bg,
            color,
            borderRadius: 999,
            padding: "2px 8px",
            fontWeight: 600,
            minWidth: 24,
            textAlign: "center",
            display: "inline-block"
          };
        })();

  return (
    <span key={i} className="scoreArrow" style={style}>
      {display}
    </span>
  );
})}

</div>

              <div className="scoreTot">{v.total ?? 0}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 28 }} />
    </div>
  );
}
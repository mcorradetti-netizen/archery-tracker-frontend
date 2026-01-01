import React from "react";

export default function SessionFilters({
  value,
  onChange,
  onReset,
  title = "Filtri",
  showReset = true
}) {
  
  const filters = value ?? {
  from: null,
  to: null,
  distance: "all",
  kind: "all",
  environment: "all",
  targetType: "all"
};

function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="title">{title}</div>

      {/* PERIODO */}
      <div className="filterBlock">
        <label>Periodo</label>
        <div className="rangeRow">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
          />
          <span>→</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => set("to", e.target.value)}
          />
        </div>
      </div>

     {/* DISTANZA */}
<div className="filterBlock">
  <label>Distanza</label>
  <div className="pillGroup">
    {[
      { value: "all", label: "Tutto" },
      { value: "18", label: "18 m" },
      { value: "25", label: "25 m" },
      { value: "30", label: "30 m" },
      { value: "50", label: "50 m" },
      { value: "70", label: "70 m" },
      { value: "90", label: "90 m" }
    ].map((d) => (
      <button
        key={d.value}
        className={`pill ${filters.distance === d.value ? "active" : ""}`}
        onClick={() => set("distance", d.value)}
      >
        {d.label}
      </button>
    ))}
  </div>
</div>

      {/* TIPO */}
      <div className="filterBlock">
        <label>Tipo</label>
        <div className="pillGroup">
          {["all", "Allenamento", "Competizione"].map((v) => (
            <button
              key={v}
              className={`pill ${filters.kind === v ? "active" : ""}`}
              onClick={() => set("kind", v)}
            >
              {v === "all" ? "Tutto" : v}
            </button>
          ))}
        </div>
      </div>

      {/* AMBIENTE */}
      <div className="filterBlock">
        <label>Ambiente</label>
        <div className="pillGroup">
          {["all", "Indoor", "Outdoor"].map((v) => (
            <button
              key={v}
              className={`pill ${filters.environment === v ? "active" : ""}`}
              onClick={() => set("environment", v)}
            >
              {v === "all" ? "Tutto" : v}
            </button>
          ))}
        </div>
      </div>

      {/* TARGET */}
      <div className="filterBlock">
        <label>Target</label>
        <div className="pillGroup">
          {[
            { value: "all", label: "Tutto" },
            { value: "Trispot", label: "Trispot" },
            { value: "40cm", label: "40 cm" },
            { value: "60cm", label: "60 cm" },
            { value: "120cm", label: "120 cm" }
          ].map((t) => (
            <button
              key={t.value}
              className={`pill ${filters.targetType === t.value ? "active" : ""}`}
              onClick={() => set("targetType", t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* AZIONI */}
      <div style={{ marginTop: 12 }}>
        
      {showReset && (
      <button
        className="ghost"
        onClick={() => onReset?.()}
      >
        Reset filtri
      </button>
)}

      </div>
    </div>
  );
}

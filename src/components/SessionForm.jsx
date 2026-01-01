import React, { useMemo, useState } from "react";

const distances = [18, 25, 30, 50, 70, 90];
const targetTypes = ["Trispot", "40cm", "60cm", "120cm"];
const environments = ["Indoor", "Outdoor"];
const kinds = ["Allenamento", "Competizione"];

export default function SessionForm({ onCreate, initialData = null }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [date, setDate] = useState(
    initialData?.date ? initialData.date.slice(0, 10) : today
  );
  const [kind, setKind] = useState(initialData?.kind || "Allenamento");
  const [targetType, setTargetType] = useState(initialData?.targetType || "Trispot");
  const [environment, setEnvironment] = useState(initialData?.environment || "Indoor");
  const [distance, setDistance] = useState(initialData?.distance || 18);

  function submit(e) {
    e.preventDefault();

    const dateLabel = new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    const sessionName = `${dateLabel} - ${kind}`;

    const payload = {
      ...initialData, // 🔴 mantiene _id, volleys, hits
      name: sessionName,
      date: new Date(date).toISOString(),
      kind,
      targetType,
      environment,
      distance: Number(distance)
    };

    // 🔹 SOLO se è una nuova sessione creo le volleys
    if (!initialData) {
      payload.volleys = Array.from({ length: 20 }, () => ({
        arrows: [null, null, null],
        total: 0,
        hits: []
      }));
    }

    onCreate(payload);
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="cardHeader">
        <div>
          <div className="title">
            {initialData ? "Modifica sessione" : "Nuova sessione"}
          </div>
          <div className="subtitle">
            {initialData
              ? "Aggiorna i dati della sessione."
              : "Crea la sessione e inizia a segnare."}
          </div>
        </div>
      </div>

      <div className="grid2">
        <label className="field">
          <span>Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Tipo</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {kinds.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid2">
        <label className="field">
          <span>Target</span>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          >
            {targetTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ambiente</span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            {environments.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Distanza</span>
        <select
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
        >
          {distances.map((d) => (
            <option key={d} value={d}>{d} m</option>
          ))}
        </select>
      </label>

      <button className="primary" type="submit">
        {initialData ? "Salva" : "Avanti"}
      </button>

      {!initialData && (
        <div className="smallMuted">
          Struttura sessione: 2×10 volée, 3 frecce per volée (max 600).
        </div>
      )}
    </form>
  );
}
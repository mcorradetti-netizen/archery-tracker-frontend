import React, { useEffect, useState } from "react";
import { api } from "./lib/api";
import SessionList from "./components/SessionList";
import SessionForm from "./components/SessionForm";
import ScoringScreen from "./components/ScoringScreen";
import StatisticsScreen from "./components/statistics/StatisticsScreen";

export default function App() {
  const [view, setView] = useState("list"); // list | new | score | statistics
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null);
  const [error, setError] = useState("");
  const [statsSessions, setStatsSessions] = useState([]);
  const [statsLabel, setStatsLabel] = useState(null);
  const [statsBackView, setStatsBackView] = useState("list");


  async function refresh() {
    try {
      setError("");
      const data = await api.listSessions();
      setSessions(data);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createSession(payload) {
    try {
      setError("");
      const created = await api.createSession(payload);
      setActive(created);
      setView("score");
      await refresh();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function openSession(id) {
    try {
      setError("");
      const s = await api.getSession(id);
      setActive(s);
      setView("score");
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function saveSession(updated) {
  try {
    setError("");
    const saved = await api.updateSession(updated._id, updated);

    // 🔴 QUESTE DUE RIGHE SONO LA CHIAVE
    setActive(saved);
    setView("score");

    await refresh();
    return saved; // 🔴 importantissimo per ScoringScreen
  } catch (e) {
    setError(String(e.message || e));
    throw e;
  }
}

  async function deleteSession(id) {
    try {
      setError("");
      await api.deleteSession(id);
      await refresh();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

function openStatisticsFromList(selectedSessions = [], filters = null) {
  setStatsSessions(selectedSessions);
  const n = selectedSessions.length;
  setStatsLabel(n ? `Analisi su ${n} session${n === 1 ? "e" : "i"}` : null);
  setStatsBackView("list");
  setView("statistics");
}

function openStatisticsFromScore() {
  if (!active) return;
  setStatsSessions([active]);
  setStatsLabel("Analisi della sessione corrente");
  setStatsBackView("score");
  setView("statistics");
}

function goHome() {
  setView("list");
  setActive(null);
}

useEffect(() => {
  // 🔒 protezione post-refresh
  if (view !== "list" && view !== "new" && view !== "score" && view !== "statistics") {
    setView("list");
    setActive(null);
  }

  // se siamo in score ma non c'è sessione attiva → torna alla home
  if (view === "score" && !active) {
    setView("list");
  }

  // se siamo in statistics ma non ci sono sessioni → torna alla home
  if (view === "statistics" && statsSessions.length === 0) {
    setView("list");
  }
}, [view, active, statsSessions]);

  return (
    <div className="appShell">
      {error && (
        <div className="toast">
          <div className="toastTitle">Errore</div>
          <div className="toastMsg">{error}</div>
          <div className="toastHint">
            Controlla che il backend sia avviato e che <code>VITE_API_BASE_URL</code> punti al backend.
          </div>
        </div>
      )}

      {view === "list" && (
        <SessionList
          sessions={sessions}
          onOpen={openSession}
          onDelete={deleteSession}
          onNew={() => setView("new")}
          onOpenStatistics={openStatisticsFromList}
        />
      )}

      {view === "new" && (
        <div className="page">
          <div className="topBar">
            <button className="ghost" onClick={() => setView("list")}>←</button>
            <div className="topBarCenter">
              <div className="title">Nuova sessione</div>
              <div className="subtitle">Imposta i parametri e vai al bersaglio.</div>
            </div>
            <div style={{ width: 44 }} />
          </div>
          <SessionForm onCreate={createSession} />
        </div>
      )}

     {view === "score" && (
  active ? (
    <ScoringScreen
      session={active}
      sessions={sessions} 
      onBack={() => setView("list")}
      onHome={goHome}
      onSave={saveSession}
      onOpenStatistics={openStatisticsFromScore}
    />
  ) : (
    <SessionList
      sessions={sessions}
      onOpen={openSession}
      onDelete={deleteSession}
      onNew={() => setView("new")}
      onOpenStatistics={openStatisticsFromList}
    />
  )
)}

      {view === "statistics" && (
        <StatisticsScreen
          sessions={statsSessions}
          selectionLabel={statsLabel}
          onBack={() => setView(statsBackView)}
          onHome={goHome}
        />
      )}

    </div>
  );
}

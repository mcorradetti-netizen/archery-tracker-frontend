const API_BASE = "/api";

async function http(path, options = {}) {
  if (!API_BASE) {
    throw new Error(
      "VITE_API_BASE_URL non è definita. Controlla le Environment Variables."
    );
  }

  let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {})
        }
      });
    } catch (err) {
      throw new Error("Connessione al backend fallita");
    }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function deleteSession(id) {
  return http(`/api/sessions/${id}`, { method: "DELETE" });
}

export const api = {
  health: () => http("/health"),
  listSessions: () => http("/sessions"),
  createSession: (payload) =>
    http("/sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getSession: (id) => http(`/sessions/${id}`),
  updateSession: (id, payload) =>
    http(`/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteSession
};

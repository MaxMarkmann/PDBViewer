import { useEffect, useState } from "react";
import MolstarViewer from "./MolstarViewer";
import "./app.css";

export default function App() {
  const [msg, setMsg] = useState("Lade...");
  const [pdbId, setPdbId] = useState("");
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const API = "http://localhost:8080";

  useEffect(() => {
    fetch(`${API}/api/hello`)
      .then((r) => r.json())
      .then((d) => setMsg(d.message))
      .catch(() => setMsg("Fehler: Backend nicht erreichbar"));
  }, []);

  async function loadStructure(e: React.FormEvent) {
    e.preventDefault();
    if (!pdbId.trim()) return;
    setLoading(true);
    setMeta(null);
    try {
      const res = await fetch(`${API}/api/structures/${encodeURIComponent(pdbId)}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMeta(data);
    } catch {
      setMeta({ error: "Nicht gefunden oder Fehler beim Laden." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: "system-ui",
        //background: "#1e1e1e",
        color: "#f0f0f0",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      {/* 🟦 Oberer Bereich: Überschrift + Suchleiste (jetzt volle Breite) */}
      <div
        style={{
          width: "95vw",
          maxWidth: 2500,
          margin: "0 auto",
          background: "#2b2b2b",
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 40, marginBottom: 16 }}>
          Protein Explorer (MVP)
        </h1>

        <p style={{ marginBottom: 32 }}>
          Backend sagt: <b style={{ color: "#8be9fd" }}>{msg}</b>
        </p>

        <form
          onSubmit={loadStructure}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="PDB-ID (z.B. 1a3n)"
            value={pdbId}
            onChange={(e) => setPdbId(e.target.value)}
            style={{
              padding: "12px 16px",
              width: "min(400px, 80%)",
              borderRadius: 6,
              border: "1px solid #555",
              background: "#3b3b3b",
              color: "#fff",
              fontSize: 16,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 20px",
              borderRadius: 6,
              border: "1px solid #555",
              background: loading ? "#444" : "#8be9fd",
              color: "#000",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {loading ? "Lade…" : "Laden"}
          </button>
        </form>
      </div>

      {/* 🟩 Breiter Metadaten-Block */}
      {meta && (
        <div
          style={{
            width: "95vw",
            maxWidth: 2500,
            margin: "32px auto 0",
            background: "#2b2b2b",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {"error" in meta ? (
            <b style={{ color: "crimson" }}>{meta.error}</b>
          ) : (
            <>
              <h2 style={{ marginBottom: 16 }}>Strukturinformationen</h2>
              <div><b>PDB-ID:</b> {meta.pdbId}</div>
              <div><b>Titel:</b> {meta.title}</div>
              <div>
                <b>Ketten:</b>{" "}
                {Array.isArray(meta.chains)
                  ? meta.chains.join(", ")
                  : meta.chains}
              </div>
              <div><b>Format:</b> {meta.format}</div>
            </>
          )}
        </div>
      )}

      {/* 🧩 Mol* Viewer: breiter Container */}
      {meta && !("error" in meta) && meta.fileUrl && (
        <div
          style={{
            width: "95vw",
            maxWidth: 2500,
            margin: "32px auto",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <MolstarViewer fileUrl={meta.fileUrl} width="100%" height="75vh" />
        </div>
      )}
    </main>
  );
}

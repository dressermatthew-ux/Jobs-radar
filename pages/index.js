import { useState, useCallback } from "react";

const COMPANIES = [
  "LEGO", "DraftKings", "Wayfair", "Amazon", "CarGurus",
  "Fidelity", "Datadog", "Toast", "New Balance", "Converse Nike", "Chewy"
];

const KEYWORDS = ["operations","analyst","program manager","project manager","supply chain","strategy","bizops","business operations","planning","process","sql","excel","stakeholder","workflow","metrics"];

const COLORS = {
  "LEGO":"#e3000b","DraftKings":"#53d337","Wayfair":"#7b2d8b","Amazon":"#ff9900",
  "CarGurus":"#00a0e9","Fidelity":"#017833","Datadog":"#632ca6","Toast":"#ff4500",
  "New Balance":"#cf0a2c","Converse Nike":"#111111","Chewy":"#0070cc"
};

function scoreJob(title, snippet) {
  const text = (title + " " + snippet).toLowerCase();
  return KEYWORDS.filter(kw => text.includes(kw)).length;
}

export default function JobRadar() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(null);
  const [progress, setProgress] = useState(0);
  const [lastScanned, setLastScanned] = useState(null);
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState([]);
  const [hidden, setHidden] = useState([]);

  const runScan = useCallback(async () => {
    setLoading(true);
    setResults([]);
    setProgress(0);

    for (let i = 0; i < COMPANIES.length; i++) {
      const company = COMPANIES[i];
      setScanning(company);
      setProgress(Math.round((i / COMPANIES.length) * 100));

      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company })
        });
        const data = await res.json();
        const scored = (data.jobs || []).map((j, idx) => ({
          ...j,
          id: `${company}-${idx}`,
          score: scoreJob(j.title || "", j.snippet || "")
        }));
        setResults(prev => [...prev, ...scored]);
      } catch (e) { /* skip */ }
    }

    setProgress(100);
    setScanning(null);
    setLoading(false);
    setLastScanned(new Date());
  }, []);

  const visible = results
    .filter(j => !hidden.includes(j.id))
    .filter(j => {
      if (filter === "saved") return saved.includes(j.id);
      if (filter === "boston") return (j.location || "").toLowerCase().includes("boston");
      if (filter === "remote") return (j.location || "").toLowerCase().includes("remote");
      return true;
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "monospace", color: "#e8e4d9", padding: 0 }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .card { border: 1px solid #1e1e2a; transition: border-color 0.2s; }
        .card:hover { border-color: #444; }
        .btn { cursor: pointer; font-family: monospace; transition: opacity 0.15s; }
        .btn:hover { opacity: 0.8; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn 0.3s ease; }
        @keyframes blink { 50% { opacity: 0; } }
        .blink { animation: blink 1s step-end infinite; }
      `}</style>

      <div style={{ background: "#0d0d14", borderBottom: "1px solid #1e1e2a", padding: "24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1 }}>JOB RADAR</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 4, letterSpacing: "0.12em" }}>MATTHEW DRESSER · OPS / PM / STRATEGY · BOSTON + REMOTE</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button className="btn" onClick={runScan} disabled={loading} style={{ background: loading ? "#1a1a24" : "#e8e4d9", color: loading ? "#666" : "#0a0a0f", border: "none", padding: "10px 22px", fontSize: 12, letterSpacing: "0.1em", fontWeight: 600, borderRadius: 4 }}>
              {loading ? `SCANNING... ${progress}%` : "▶ RUN SCAN"}
            </button>
            {lastScanned && !loading && <div style={{ fo

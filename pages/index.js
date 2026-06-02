import { useState, useCallback } from "react";

const PROFILE = {
  companies: [
    { name: "LEGO", query: "LEGO Group Boston operations analyst program manager jobs 2026" },
    { name: "DraftKings", query: "DraftKings Boston operations program manager jobs 2026" },
    { name: "Wayfair", query: "Wayfair Boston strategy operations analyst jobs 2026" },
    { name: "Amazon", query: "Amazon Boston operations analyst program manager jobs 2026" },
    { name: "CarGurus", query: "CarGurus Boston operations analyst jobs 2026" },
    { name: "Fidelity", query: "Fidelity Boston business operations analyst jobs 2026" },
    { name: "Datadog", query: "Datadog Boston strategy operations jobs 2026" },
    { name: "Toast", query: "Toast Boston operations analyst program manager jobs 2026" },
    { name: "New Balance", query: "New Balance Boston operations supply chain analyst jobs 2026" },
    { name: "Converse Nike", query: "Converse Nike Boston operations analyst jobs 2026" },
    { name: "Chewy", query: "Chewy Boston operations analyst jobs 2026" },
  ],
};

const KEYWORDS = ["operations","analyst","program manager","project manager","supply chain","strategy","bizops","business operations","planning","process","sql","excel","stakeholder","workflow","metrics"];

function scoreJob(title, snippet) {
  const text = (title + " " + snippet).toLowerCase();
  return KEYWORDS.filter(kw => text.includes(kw)).length;
}

const COLORS = {
  "LEGO":"#e3000b","DraftKings":"#53d337","Wayfair":"#7b2d8b","Amazon":"#ff9900",
  "CarGurus":"#00a0e9","Fidelity":"#017833","Datadog":"#632ca6","Toast":"#ff4500",
  "New Balance":"#cf0a2c","Converse Nike":"#111111","Chewy":"#0070cc"
};

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

    for (let i = 0; i < PROFILE.companies.length; i++) {
      const company = PROFILE.companies[i];
      setScanning(company.name);
      setProgress(Math.round((i / PROFILE.companies.length) * 100));

      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            tools: [{ type: "web_search_20250305", name: "web_search" }],
            system: `You are a job search assistant. Search for current open job postings at ${company.name} matching: Operations Analyst, Business Analyst, Program Manager, Project Manager, Supply Chain Analyst, Strategy & Operations, BizOps. Location: Boston MA or Remote. Level: Entry or Mid-level. Return ONLY a JSON array, no markdown, no explanation, like: [{"title":"...","company":"${company.name}","location":"...","url":"...","snippet":"...","posted":"..."}]. If none found, return [].`,
            messages: [{ role: "user", content: `Find current open jobs at ${company.name} matching the criteria. Today is ${new Date().toLocaleDateString()}.` }]
          })
        });
        const data = await res.json();
        const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
        const start = text.indexOf("["), end = text.lastIndexOf("]");
        if (start !== -1) {
          const jobs = JSON.parse(text.slice(start, end + 1));
          const scored = jobs.map((j, idx) => ({ ...j, id: `${company.name}-${idx}`, score: scoreJob(j.title, j.snippet) }));
          setResults(prev => [...prev, ...scored]);
        }
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

      {/* Header */}
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
            {lastScanned && !loading && <div style={{ fontSize: 10, color: "#555", marginTop: 6 }}>Last scan: {lastScanned.toLocaleTimeString()}</div>}
          </div>
        </div>
        {loading && (
          <div style={{ maxWidth: 900, margin: "16px auto 0" }}>
            <div style={{ height: 2, background: "#1e1e2a", borderRadius: 1, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#e8e4d9", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 6, letterSpacing: "0.1em" }}>
              {scanning ? `SCANNING ${scanning.toUpperCase()}` : "COMPILING"}<span className="blink">_</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>
        {/* Company dots */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {PROFILE.companies.map(c => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#0d0d14", border: "1px solid #1e1e2a", borderRadius: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[c.name] || "#666", display: "inline-block" }} />
              <span style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.08em" }}>{c.name.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        {results.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["all","boston","remote","saved"].map(f => (
              <button key={f} className="btn" onClick={() => setFilter(f)} style={{ background: filter === f ? "#e8e4d9" : "transparent", color: filter === f ? "#0a0a0f" : "#666", border: `1px solid ${filter === f ? "#e8e4d9" : "#1e1e2a"}`, padding: "5px 14px", fontSize: 11, letterSpacing: "0.1em", borderRadius: 3 }}>
                {f.toUpperCase()}{f === "all" ? ` (${results.filter(j => !hidden.includes(j.id)).length})` : f === "saved" ? ` (${saved.length})` : ""}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
            <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>READY</div>
            <div style={{ fontSize: 12, letterSpacing: "0.1em" }}>HIT RUN SCAN TO CHECK ALL 11 COMPANIES</div>
          </div>
        )}

        {/* Job cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map(job => (
            <div key={job.id} className="card fade" style={{ background: "#0d0d14", borderRadius: 6, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[job.company] || "#666", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "#666", letterSpacing: "0.1em" }}>{job.company?.toUpperCase()}</span>
                    {job.location && <span style={{ fontSize: 10, padding: "2px 8px", background: "#1a1a24", color: "#888", borderRadius: 3 }}>{job.location}</span>}
                    {job.score >= 4 && <span style={{ fontSize: 10, padding: "2px 8px", background: "#1a2410", color: "#5a9a3a", borderRadius: 3 }}>STRONG MATCH</span>}
                    {job.score >= 2 && job.score < 4 && <span style={{ fontSize: 10, padding: "2px 8px", background: "#1a1810", color: "#8a7a3a", borderRadius: 3 }}>POSSIBLE FIT</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#e8e4d9", marginBottom: 6 }}>{job.title}</div>
                  {job.snippet && <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>{job.snippet.slice(0, 200)}{job.snippet.length > 200 ? "..." : ""}</div>}
                  {job.posted && <div style={{ fontSize: 10, color: "#444", marginTop: 6, letterSpacing: "0.06em" }}>POSTED: {job.posted}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ background: "#e8e4d9", color: "#0a0a0f", padding: "6px 14px", fontSize: 10, letterSpacing: "0.1em", borderRadius: 3, textAlign: "center", fontWeight: 600, fontFamily: "monospace" }}>
                      APPLY →
                    </a>
                  )}
                  <button className="btn" onClick={() => setSaved(p => p.includes(job.id) ? p.filter(x => x !== job.id) : [...p, job.id])} style={{ background: saved.includes(job.id) ? "#1a2410" : "transparent", color: saved.includes(job.id) ? "#5a9a3a" : "#444", border: `1px solid ${saved.includes(job.id) ? "#2a3a1a" : "#1e1e2a"}`, padding: "6px 14px", fontSize: 10, letterSpacing: "0.1em", borderRadius: 3 }}>
                    {saved.includes(job.id) ? "✓ SAVED" : "SAVE"}
                  </button>
                  <button className="btn" onClick={() => setHidden(p => [...p, job.id])} style={{ background: "transparent", color: "#333", border: "1px solid #1a1a1a", padding: "6px 14px", fontSize: 10, letterSpacing: "0.1em", borderRadius: 3 }}>
                    HIDE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length > 0 && !loading && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #1e1e2a", fontSize: 10, color: "#333", letterSpacing: "0.1em", display: "flex", justifyContent: "space-between" }}>
            <span>{visible.length} ROLES SHOWN · {hidden.length} HIDDEN</span>
            <span>RUN SCAN AGAIN TO REFRESH</span>
          </div>
        )}
      </div>
    </div>
  );
}

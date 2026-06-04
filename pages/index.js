import { useState, useCallback } from "react";

const ALL_COMPANIES = [
  { name: "LEGO", domain: "lego.com" },
  { name: "DraftKings", domain: "draftkings.com" },
  { name: "Wayfair", domain: "wayfair.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "CarGurus", domain: "cargurus.com" },
  { name: "Fidelity", domain: "fidelity.com" },
  { name: "Datadog", domain: "datadoghq.com" },
  { name: "Toast", domain: "toasttab.com" },
  { name: "New Balance", domain: "newbalance.com" },
  { name: "Converse Nike", domain: "converse.com" },
  { name: "Chewy", domain: "chewy.com" },
];

const JOB_TYPES = [
  "Operations Analyst",
  "Business Analyst",
  "Program Manager",
  "Project Manager",
  "Supply Chain Analyst",
  "Strategy & Operations",
  "BizOps Analyst",
];

const LEVELS = ["Entry-level", "Mid-level", "Senior"];
const LOCATIONS = ["Boston", "Remote", "Both"];

const KEYWORDS = ["operations","analyst","program manager","project manager","supply chain","strategy","bizops","business operations","planning","process","sql","excel","stakeholder","workflow","metrics"];

function scoreJob(title, snippet) {
  const text = (title + " " + snippet).toLowerCase();
  return KEYWORDS.filter(kw => text.includes(kw)).length;
}

export default function JobRadar() {
  const [activeCompanies, setActiveCompanies] = useState(ALL_COMPANIES.map(c => c.name));
  const [activeJobTypes, setActiveJobTypes] = useState(JOB_TYPES);
  const [activeLevel, setActiveLevel] = useState(["Entry-level", "Mid-level"]);
  const [activeLocation, setActiveLocation] = useState("Both");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(null);
  const [progress, setProgress] = useState(0);
  const [lastScanned, setLastScanned] = useState(null);
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggle = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const runScan = useCallback(async () => {
    setLoading(true);
    setResults([]);
    setProgress(0);
    setScannedCount(0);

    const companies = ALL_COMPANIES.filter(c => activeCompanies.includes(c.name));

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      setScanning(company.name);
      setProgress(Math.round((i / companies.length) * 100));

      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: company.name,
            jobTypes: activeJobTypes,
            levels: activeLevel,
            location: activeLocation,
          })
        });
        const data = await res.json();
        const scored = (data.jobs || []).map((j, idx) => ({
          ...j,
          id: company.name + "-" + idx,
          domain: company.domain,
          score: scoreJob(j.title || "", j.snippet || "")
        }));
        setResults(prev => [...prev, ...scored]);
        setScannedCount(i + 1);
      } catch (e) {}
    }

    setProgress(100);
    setScanning(null);
    setLoading(false);
    setLastScanned(new Date());
  }, [activeCompanies, activeJobTypes, activeLevel, activeLocation]);

  const visible = results
    .filter(j => !hidden.includes(j.id))
    .filter(j => {
      if (filter === "saved") return saved.includes(j.id);
      if (filter === "boston") return (j.location || "").toLowerCase().includes("boston");
      if (filter === "remote") return (j.location || "").toLowerCase().includes("remote");
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const strongMatches = results.filter(j => j.score >= 4).length;
  const totalVisible = results.filter(j => !hidden.includes(j.id)).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f3", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1a1a1a" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .card { background: white; border: 1px solid #e8e8e8; border-radius: 12px; transition: box-shadow 0.2s, transform 0.2s; }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
        .check-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; cursor: pointer; border-radius: 6px; }
        .check-row:hover { opacity: 0.75; }
        .check-box { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #ddd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .check-box.on { background: #1a1a1a; border-color: #1a1a1a; }
        .scan-btn { background: #1a1a1a; color: white; border: none; padding: 11px 0; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.15s; margin-top: 8px; }
        .scan-btn:hover:not(:disabled) { background: #333; }
        .scan-btn:disabled { background: #ccc; cursor: not-allowed; }
        .progress-track { height: 3px; background: #f0f0f0; border-radius: 2px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; background: #1a1a1a; border-radius: 2px; transition: width 0.3s; }
        .pill { cursor: pointer; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 500; transition: all 0.15s; border: 1.5px solid #e8e8e8; background: white; color: #666; }
        .pill.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        .loc-btn { flex: 1; padding: 7px 0; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1.5px solid #e8e8e8; background: white; color: #666; cursor: pointer; transition: all 0.15s; }
        .loc-btn.on { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        .sidebar-section { margin-bottom: 28px; }
        .sidebar-label { font-size: 10px; font-weight: 700; color: #999; letter-spacing: 0.1em; margin-bottom: 12px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn 0.3s ease; }
        @keyframes blink { 50% { opacity: 0; } }
        .blink { animation: blink 1s step-end infinite; }
        .company-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; cursor: pointer; }
        .company-row:hover { opacity: 0.75; }
      `}</style>

      {/* Top nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e8e8e8", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "1.5px solid #e8e8e8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 14, color: "#666" }}>
            {sidebarOpen ? "← Hide" : "☰ Filters"}
          </button>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Job Radar</span>
            <span style={{ fontSize: 12, color: "#bbb", marginLeft: 10 }}>Matthew Dresser</span>
          </div>
        </div>
        {lastScanned && !loading && (
          <div style={{ fontSize: 11, color: "#bbb" }}>Last scan: {lastScanned.toLocaleTimeString()}</div>
        )}
      </div>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{ width: 260, flexShrink: 0, padding: "28px 0 28px 0", marginRight: 28 }}>
            <div style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 14, padding: "24px 20px", position: "sticky", top: 72 }}>

              {/* Scan button */}
              <button className="scan-btn" onClick={runScan} disabled={loading}>
                {loading ? "Scanning " + progress + "%" : "▶ Run Scan"}
              </button>
              {loading && (
                <div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: progress + "%" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
                    Scanning {scanning}<span className="blink">...</span>
                  </div>
                </div>
              )}

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "24px 0" }} />

              {/* Companies */}
              <div className="sidebar-section">
                <div className="sidebar-label">COMPANIES</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "#bbb", cursor: "pointer" }} onClick={() => setActiveCompanies(ALL_COMPANIES.map(c => c.name))}>All</span>
                  <span style={{ fontSize: 11, color: "#bbb", cursor: "pointer" }} onClick={() => setActiveCompanies([])}>None</span>
                </div>
                {ALL_COMPANIES.map(c => (
                  <div key={c.name} className="company-row" onClick={() => toggle(activeCompanies, setActiveCompanies, c.name)}>
                    <div className={"check-box" + (activeCompanies.includes(c.name) ? " on" : "")}>
                      {activeCompanies.includes(c.name) && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <img src={"https://logo.clearbit.com/" + c.domain} alt={c.name} width={18} height={18} style={{ borderRadius: 4, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                    <span style={{ fontSize: 13, color: "#333" }}>{c.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "20px 0" }} />

              {/* Job Types */}
              <div className="sidebar-section">
                <div className="sidebar-label">JOB TYPE</div>
                {JOB_TYPES.map(j => (
                  <div key={j} className="check-row" onClick={() => toggle(activeJobTypes, setActiveJobTypes, j)}>
                    <div className={"check-box" + (activeJobTypes.includes(j) ? " on" : "")}>
                      {activeJobTypes.includes(j) && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: "#333" }}>{j}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "20px 0" }} />

              {/* Experience */}
              <div className="sidebar-section">
                <div className="sidebar-label">EXPERIENCE</div>
                {LEVELS.map(l => (
                  <div key={l} className="check-row" onClick={() => toggle(activeLevel, setActiveLevel, l)}>
                    <div className={"check-box" + (activeLevel.includes(l) ? " on" : "")}>
                      {activeLevel.includes(l) && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: "#333" }}>{l}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "20px 0" }} />

              {/* Location */}
              <div className="sidebar-section" style={{ marginBottom: 0 }}>
                <div className="sidebar-label">LOCATION</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {LOCATIONS.map(l => (
                    <button key={l} className={"loc-btn" + (activeLocation === l ? " on" : "")} onClick={() => setActiveLocation(l)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, padding: "28px 0" }}>

          {/* Stats */}
          {results.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Found", value: totalVisible },
                { label: "Strong Matches", value: strongMatches },
                { label: "Companies Scanned", value: scannedCount },
                { label: "Saved", value: saved.length },
              ].map(stat => (
                <div key={stat.label} className="card fade" style={{ padding: "16px 20px" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Result filters */}
          {results.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["all", "boston", "remote", "saved"].map(f => (
                <button key={f} className={"pill" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "all" ? " (" + totalVisible + ")" : f === "saved" ? " (" + saved.length + ")" : ""}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🎯</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to scan</div>
              <div style={{ fontSize: 14, color: "#999" }}>Configure your filters and hit Run Scan</div>
            </div>
          )}

          {/* Job cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map(job => (
              <div key={job.id} className="card fade" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ display: "flex", gap: 14, flex: 1 }}>
                    <img src={"https://logo.clearbit.com/" + job.domain} alt={job.company} width={40} height={40} style={{ borderRadius: 8, objectFit: "contain", flexShrink: 0, marginTop: 2, background: "#f8f8f6" }} onError={e => { e.target.style.display = "none"; }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#999" }}>{job.company}</span>
                        {job.location && <span className="tag" style={{ background: "#f4f4f4", color: "#666" }}>{job.location}</span>}
                        {job.score >= 4 && <span className="tag" style={{ background: "#e8f5e9", color: "#2e7d32" }}>Strong Match</span>}
                        {job.score >= 2 && job.score < 4 && <span className="tag" style={{ background: "#fff8e1", color: "#f57f17" }}>Possible Fit</span>}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.01em" }}>{job.title}</div>
                      {job.snippet && <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{job.snippet.slice(0, 220)}{job.snippet.length > 220 ? "..." : ""}</div>}
                      {job.posted && <div style={{ fontSize: 11, color: "#bbb", marginTop: 8 }}>Posted: {job.posted}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ background: "#1a1a1a", color: "white", padding: "8px 18px", fontSize: 12, fontWeight: 600, borderRadius: 8, textAlign: "center", fontFamily: "inherit" }}>Apply →</a>
                    )}
                    <button className="btn" onClick={() => setSaved(p => p.includes(job.id) ? p.filter(x => x !== job.id) : [...p, job.id])} style={{ background: saved.includes(job.id) ? "#e8f5e9" : "white", color: saved.includes(job.id) ? "#2e7d32" : "#999", border: "1.5px solid " + (saved.includes(job.id) ? "#a5d6a7" : "#e8e8e8"), padding: "8px 18px", fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: "pointer" }}>
                      {saved.includes(job.id) ? "✓ Saved" : "Save"}
                    </button>
                    <button className="btn" onClick={() => setHidden(p => [...p, job.id])} style={{ background: "white", color: "#ccc", border: "1.5px solid #f0f0f0", padding: "8px 18px", fontSize: 12, borderRadius: 8, cursor: "pointer" }}>
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length > 0 && !loading && (
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #e8e8e8", fontSize: 12, color: "#bbb", display: "flex", justifyContent: "space-between" }}>
              <span>{visible.length} roles shown · {hidden.length} hidden</span>
              <span>Run scan again to refresh</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";

const COMPANIES = [
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

const KEYWORDS = ["operations","analyst","program manager","project manager","supply chain","strategy","bizops","business operations","planning","process","sql","excel","stakeholder","workflow","metrics"];

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
  const [scannedCount, setScannedCount] = useState(0);

  const runScan = useCallback(async () => {
    setLoading(true);
    setResults([]);
    setProgress(0);
    setScannedCount(0);

    for (let i = 0; i < COMPANIES.length; i++) {
      const company = COMPANIES[i];
      setScanning(company.name);
      setProgress(Math.round((i / COMPANIES.length) * 100));

      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: company.name })
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

  const strongMatches = results.filter(j => j.score >= 4).length;
  const totalVisible = results.filter(j => !hidden.includes(j.id)).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f6", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1a1a1a" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .card { background: white; border: 1px solid #e8e8e8; border-radius: 12px; transition: box-shadow 0.2s, transform 0.2s; }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .btn { cursor: pointer; transition: all 0.15s; }
        .btn:hover { opacity: 0.85; }
        .pill { cursor: pointer; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 500; transition: all 0.15s; border: 1.5px solid #e8e8e8; background: white; color: #666; }
        .pill.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        .pill:hover { border-color: #1a1a1a; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn 0.35s ease; }
        @keyframes blink { 50% { opacity: 0; } }
        .blink { animation: blink 1s step-end infinite; }
        .logo-img { border-radius: 8px; object-fit: contain; background: #f8f8f6; }
        .stat-card { background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 20px 24px; }
        .scan-btn { background: #1a1a1a; color: white; border: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; cursor: pointer; transition: background 0.15s; }
        .scan-btn:hover:not(:disabled) { background: #333; }
        .scan-btn:disabled { background: #ccc; cursor: not-allowed; }
        .progress-track { height: 3px; background: #f0f0f0; border-radius: 2px; overflow: hidden; margin-top: 12px; }
        .progress-fill { height: 100%; background: #1a1a1a; border-radius: 2px; transition: width 0.3s; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
      `}</style>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e8e8e8", padding: "20px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Job Radar</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Matthew Dresser · Ops / PM / Strategy · Boston + Remote</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button className="scan-btn" onClick={runScan} disabled={loading}>
              {loading ? "Scanning... " + progress + "%" : "Run Scan"}
            </button>
            {lastScanned && !loading && (
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>Last scan: {lastScanned.toLocaleTimeString()}</div>
            )}
          </div>
        </div>
        {loading && (
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: progress + "%" }} />
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
              Scanning {scanning}<span className="blink">...</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 40px" }}>

        {/* Stats */}
        {results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Jobs Found", value: totalVisible },
              { label: "Strong Matches", value: strongMatches },
              { label: "Companies Scanned", value: scannedCount },
              { label: "Saved", value: saved.length },
            ].map(stat => (
              <div key={stat.label} className="stat-card fade">
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Company logos */}
        <div style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.08em", marginBottom: 16 }}>MONITORING</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            {COMPANIES.map(c => (
              <div key={c.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <img
                  src={"https://logo.clearbit.com/" + c.domain}
                  alt={c.name}
                  width={32}
                  height={32}
                  className="logo-img"
                  onError={e => { e.target.style.display = "none"; }}
                />
                <span style={{ fontSize: 9, color: "#bbb", fontWeight: 500 }}>{c.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
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
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to scan</div>
            <div style={{ fontSize: 14, color: "#999" }}>Hit Run Scan to check all 11 companies for matching roles</div>
          </div>
        )}

        {/* Job cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map(job => (
            <div key={job.id} className="card fade" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", gap: 16, flex: 1 }}>
                  <img
                    src={"https://logo.clearbit.com/" + job.domain}
                    alt={job.company}
                    width={40}
                    height={40}
                    className="logo-img"
                    style={{ flexShrink: 0, marginTop: 2 }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#999" }}>{job.company}</span>
                      {job.location && (
                        <span className="tag" style={{ background: "#f4f4f4", color: "#666" }}>{job.location}</span>
                      )}
                      {job.score >= 4 && (
                        <span className="tag" style={{ background: "#e8f5e9", color: "#2e7d32" }}>Strong Match</span>
                      )}
                      {job.score >= 2 && job.score < 4 && (
                        <span className="tag" style={{ background: "#fff8e1", color: "#f57f17" }}>Possible Fit</span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.01em" }}>{job.title}</div>
                    {job.snippet && (
                      <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>
                        {job.snippet.slice(0, 200)}{job.snippet.length > 200 ? "..." : ""}
                      </div>
                    )}
                    {job.posted && (
                      <div style={{ fontSize: 11, color: "#bbb", marginTop: 8 }}>Posted: {job.posted}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ background: "#1a1a1a", color: "white", padding: "8px 18px", fontSize: 12, fontWeight: 600, borderRadius: 8, textAlign: "center", fontFamily: "inherit" }}>
                      Apply →
                    </a>
                  )}
                  <button
                    className="btn"
                    onClick={() => setSaved(p => p.includes(job.id) ? p.filter(x => x !== job.id) : [...p, job.id])}
                    style={{ background: saved.includes(job.id) ? "#e8f5e9" : "white", color: saved.includes(job.id) ? "#2e7d32" : "#999", border: "1.5px solid " + (saved.includes(job.id) ? "#a5d6a7" : "#e8e8e8"), padding: "8px 18px", fontSize: 12, fontWeight: 500, borderRadius: 8 }}
                  >
                    {saved.includes(job.id) ? "✓ Saved" : "Save"}
                  </button>
                  <button
                    className="btn"
                    onClick={() => setHidden(p => [...p, job.id])}
                    style={{ background: "white", color: "#ccc", border: "1.5px solid #f0f0f0", padding: "8px 18px", fontSize: 12, borderRadius: 8 }}
                  >
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
  );
}

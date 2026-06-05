import { useState, useCallback } from "react";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const COMPANIES = [
  { name: "Amazon", domain: "amazon.com" },
  { name: "CarGurus", domain: "cargurus.com" },
  { name: "Fidelity", domain: "fidelity.com" },
  { name: "Datadog", domain: "datadoghq.com" },
  { name: "Toast", domain: "toasttab.com" },
  { name: "New Balance", domain: "newbalance.com" },
  { name: "Converse", domain: "converse.com" },
  { name: "Nike", domain: "nike.com" },
  { name: "Chewy", domain: "chewy.com" },
  { name: "Reebok", domain: "reebok.com" },
  { name: "DraftKings", domain: "draftkings.com" },
  { name: "Wayfair", domain: "wayfair.com" },
  { name: "LEGO", domain: "lego.com" },
  { name: "Hasbro", domain: "hasbro.com" },
  { name: "TJX", domain: "tjx.com" },
  { name: "Staples", domain: "staples.com" },
  { name: "Dunkin", domain: "dunkindonuts.com" },
  { name: "SharkNinja", domain: "sharkninja.com" },
];

const KEYWORDS = ["operations","analyst","program manager","project manager","supply chain","strategy","bizops","business operations","planning","process","sql","excel","stakeholder","workflow","metrics","coordinator","manager","associate","specialist","finance","marketing","data","product","engineer","designer","recruiter","sales","legal","hr","people","research","compliance"];

function scoreJob(title, snippet) {
  const text = (title + " " + snippet).toLowerCase();
  return KEYWORDS.filter(kw => text.includes(kw)).length;
}

function CompanyLogo({ domain, size = 18 }) {
  const [errored, setErrored] = useState(false);
  if (errored) return (
    <div style={{ width: size, height: size, borderRadius: 4, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.55, color: "#999", flexShrink: 0 }}>
      {domain[0].toUpperCase()}
    </div>
  );
  return (
    <img
      src={"https://www.google.com/s2/favicons?domain=" + domain + "&sz=64"}
      alt={domain}
      width={size}
      height={size}
      style={{ borderRadius: 4, objectFit: "contain", flexShrink: 0 }}
      onError={() => setErrored(true)}
    />
  );
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
          id: company.name + "-" + i + "-" + idx,
          domain: company.domain,
          score: scoreJob(j.title || "", j.snippet || "")
        }));
        setResults(prev => [...prev, ...scored]);
        setScannedCount(i + 1);
      } catch (e) {}
      await sleep(5000);
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
      if (filter === "boston") return (j.location || "").toLowerCase().includes("boston") || (j.location || "").toLowerCase().includes("massachusetts") || (j.location || "").toLowerCase().includes(" ma");
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
        .scan-btn { background: #1a1a1a; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .scan-btn:hover:not(:disabled) { background: #333; }
        .scan-btn:disabled { background: #ccc; cursor: not-allowed; }
        .progress-track { height: 3px; background: #f0f0f0; border-radius: 2px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; background: #1a1a1a; border-radius: 2px; transition: width 0.3s; }
        .pill { cursor: pointer; border-radius: 20px; padding: 6px 18px; font-size: 12px; font-weight: 500; transition: all 0.15s; border: 1.5px solid #e8e8e8; background: white; color: #666; }
        .pill.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn 0.3s ease; }
        @keyframes blink { 50% { opacity: 0; } }
        .blink { animation: blink 1s step-end infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }
      `}</style>

      {/* Nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e8e8e8", padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Job Radar</span>
          <span style={{ fontSize: 12, color: "#bbb", marginLeft: 12 }}>Matthew Dresser · Entry & Mid-level · Boston + Remote</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {lastScanned && !loading && (
            <div style={{ fontSize: 11, color: "#bbb" }}>Last scan: {lastScanned.toLocaleTimeString()}</div>
          )}
          <button className="scan-btn" onClick={runScan} disabled={loading}>
            {loading ? "Scanning " + progress + "%" : "▶ Run Scan"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {loading && (
        <div style={{ background: "white", padding: "0 40px 12px", borderBottom: "1px solid #e8e8e8" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: progress + "%" }} />
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
              Scanning {scanning}<span className="blink">...</span> ({scannedCount}/{COMPANIES.length} companies)
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 40px" }}>

        {/* Company pills */}
        <div style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 12, padding: "18px 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: "0.1em", marginBottom: 14 }}>MONITORING {COMPANIES.length} COMPANIES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            {COMPANIES.map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f8f8f6", borderRadius: 20, fontSize: 12, color: "#444" }}>
                <CompanyLogo domain={c.domain} size={16} />
                {c.name}
              </div>
            ))}
          </div>
        </div>

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
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

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
            <div style={{ fontSize: 44, marginBottom: 14 }}>🎯</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Ready to scan</div>
            <div style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>Searches all {COMPANIES.length} companies for entry & mid-level roles in Boston or Remote</div>
            <button className="scan-btn" onClick={runScan} disabled={loading}>▶ Run Scan</button>
          </div>
        )}

        {/* Job cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map(job => (
            <div key={job.id} className="card fade" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", gap: 14, flex: 1 }}>
                  <CompanyLogo domain={job.domain} size={42} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#999" }}>{job.company}</span>
                      {job.location && <span className="tag" style={{ background: "#f4f4f4", color: "#666" }}>{job.location}</span>}
                      {job.score >= 4 && <span className="tag" style={{ background: "#e8f5e9", color: "#2e7d32" }}>Strong Match</span>}
                      {job.score >= 2 && job.score < 4 && <span className="tag" style={{ background: "#fff8e1", color: "#f57f17" }}>Possible Fit</span>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.01em" }}>{job.title}</div>
                    {job.snippet && <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{job.snippet.slice(0, 240)}{job.snippet.length > 240 ? "..." : ""}</div>}
                    {job.posted && <div style={{ fontSize: 11, color: "#bbb", marginTop: 8 }}>Posted: {job.posted}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ background: "#1a1a1a", color: "white", padding: "8px 18px", fontSize: 12, fontWeight: 600, borderRadius: 8, textAlign: "center", fontFamily: "inherit" }}>Apply →</a>
                  )}
                  <button onClick={() => setSaved(p => p.includes(job.id) ? p.filter(x => x !== job.id) : [...p, job.id])} style={{ background: saved.includes(job.id) ? "#e8f5e9" : "white", color: saved.includes(job.id) ? "#2e7d32" : "#999", border: "1.5px solid " + (saved.includes(job.id) ? "#a5d6a7" : "#e8e8e8"), padding: "8px 18px", fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                    {saved.includes(job.id) ? "✓ Saved" : "Save"}
                  </button>
                  <button onClick={() => setHidden(p => [...p, job.id])} style={{ background: "white", color: "#ccc", border: "1.5px solid #f0f0f0", padding: "8px 18px", fontSize: 12, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
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

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

const KEYWORDS = ["operations","analyst","program manager","project manager","supply chain","strategy","bizops","business operations","planning","process","sql","excel","stakeholder","workflow","metrics","coordinator","associate","specialist","finance","marketing","data","product","research","compliance"];

function scoreJob(title, snippet) {
  const text = (title + " " + snippet).toLowerCase();
  return KEYWORDS.filter(kw => text.includes(kw)).length;
}

const parseDate = (str) => {
  if (!str) return 0;
  const s = str.toLowerCase();
  if (s.includes("hour") || s.includes("just")) return Date.now();
  if (s.includes("day")) return Date.now() - (parseInt(s) || 1) * 86400000;
  if (s.includes("week")) return Date.now() - (parseInt(s) || 1) * 604800000;
  if (s.includes("month")) return Date.now() - (parseInt(s) || 1) * 2592000000;
  return 0;
};

function CompanyLogo({ domain, size = 18 }) {
  const [errored, setErrored] = useState(false);
  if (errored) return (
    <div style={{ width: size, height: size, borderRadius: 4, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.55, color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>
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
      await sleep(1500);
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
    .sort((a, b) => parseDate(b.posted) - parseDate(a.posted));

  const strongMatches = results.filter(j => j.score >= 4).length;
  const totalVisible = results.filter(j => !hidden.includes(j.id)).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "white", position: "relative", overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animated-bg {
          position: fixed; inset: 0;
          background: linear-gradient(-45deg, #0a0a0f, #0d1117, #0f0a1a, #0a0f1a, #110a1a, #0a1a0f);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          z-index: 0;
        }
        .orb {
          position: fixed; border-radius: 50%; filter: blur(80px);
          animation: pulse 8s ease-in-out infinite; z-index: 0; pointer-events: none;
        }
        .glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .scan-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
          color: white; border: none; padding: 13px 32px; border-radius: 50px;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(139,92,246,0.4); letter-spacing: 0.02em;
        }
        .scan-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(139,92,246,0.6); }
        .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .pill {
          cursor: pointer; border-radius: 50px; padding: 7px 18px; font-size: 12px;
          font-weight: 500; transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
        }
        .pill:hover { border-color: rgba(255,255,255,0.25); color: white; }
        .pill.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent; color: white;
          box-shadow: 0 4px 15px rgba(139,92,246,0.4);
        }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 50px; font-size: 11px; font-weight: 500; }
        .progress-track { height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; margin-top: 12px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 2px; transition: width 0.4s ease; }
        .blink { animation: blink 1s step-end infinite; }
        .fade { animation: fadeIn 0.4s ease; }
        .company-chip {
          display: flex; align-items: center; gap: 6px; padding: 5px 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50px; font-size: 12px; color: rgba(255,255,255,0.7); transition: all 0.2s;
        }
        .company-chip:hover { background: rgba(255,255,255,0.08); color: white; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div className="animated-bg" />
      <div className="orb" style={{ width: 600, height: 600, top: -200, left: -200, background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent)" }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -100, right: -100, background: "radial-gradient(circle, rgba(168,85,247,0.12), transparent)", animationDelay: "3s" }} />
      <div className="orb" style={{ width: 400, height: 400, top: "40%", right: "20%", background: "radial-gradient(circle, rgba(59,130,246,0.08), transparent)", animationDelay: "6s" }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <div style={{ padding: "60px 40px 50px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 50, fontSize: 12, color: "#a78bfa", marginBottom: 24, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
            Live Job Scanner · Boston + Remote
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16, background: "linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Job Radar
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>Matthew Dresser · Entry & Mid-level Roles</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", marginBottom: 36 }}>Scanning {COMPANIES.length} companies · Sorted by most recent</p>
          <button className="scan-btn" onClick={runScan} disabled={loading}>
            {loading ? "Scanning " + progress + "%" : "▶ Run Scan"}
          </button>
          {lastScanned && !loading && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 12 }}>Last scan: {lastScanned.toLocaleTimeString()}</div>
          )}
          {loading && (
            <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: progress + "%" }} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                Scanning {scanning}<span className="blink">...</span> · {scannedCount}/{COMPANIES.length} companies
              </div>
            </div>
          )}
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 40px" }}>

          {/* Company chips */}
          <div className="glass" style={{ borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", marginBottom: 14 }}>MONITORING {COMPANIES.length} COMPANIES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COMPANIES.map(c => (
                <div key={c.name} className="company-chip">
                  <CompanyLogo domain={c.domain} size={14} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {results.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Found", value: totalVisible, color: "#a78bfa" },
                { label: "Strong Matches", value: strongMatches, color: "#34d399" },
                { label: "Companies Scanned", value: scannedCount, color: "#60a5fa" },
                { label: "Saved", value: saved.length, color: "#f59e0b" },
              ].map(stat => (
                <div key={stat.label} className="glass-card fade" style={{ padding: "20px 24px" }}>
                  <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{stat.label}</div>
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
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "rgba(255,255,255,0.9)" }}>Ready to scan</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Hit Run Scan to search all {COMPANIES.length} companies for matching roles</div>
            </div>
          )}

          {/* Job cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map(job => (
              <div key={job.id} className="glass-card fade" style={{ padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ display: "flex", gap: 16, flex: 1 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <CompanyLogo domain={job.domain} size={26} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{job.company}</span>
                        {job.location && <span className="tag" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>{job.location}</span>}
                        {job.score >= 4 && <span className="tag" style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>Strong Match</span>}
                        {job.score >= 2 && job.score < 4 && <span className="tag" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Possible Fit</span>}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 8, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>{job.title}</div>
                      {job.snippet && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{job.snippet.slice(0, 220)}{job.snippet.length > 220 ? "..." : ""}</div>}
                      {job.posted && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>Posted: {job.posted}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", padding: "8px 18px", fontSize: 12, fontWeight: 600, borderRadius: 50, textAlign: "center", fontFamily: "inherit", boxShadow: "0 4px 15px rgba(139,92,246,0.3)", whiteSpace: "nowrap" }}>
                        Apply →
                      </a>
                    )}
                    <button onClick={() => setSaved(p => p.includes(job.id) ? p.filter(x => x !== job.id) : [...p, job.id])} style={{ background: saved.includes(job.id) ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", color: saved.includes(job.id) ? "#34d399" : "rgba(255,255,255,0.4)", border: "1px solid " + (saved.includes(job.id) ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"), padding: "8px 18px", fontSize: 12, fontWeight: 500, borderRadius: 50, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      {saved.includes(job.id) ? "✓ Saved" : "Save"}
                    </button>
                    <button onClick={() => setHidden(p => [...p, job.id])} style={{ background: "transparent", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.06)", padding: "8px 18px", fontSize: 12, borderRadius: 50, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length > 0 && !loading && (
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.2)", display: "flex", justifyContent: "space-between" }}>
              <span>{visible.length} roles shown · {hidden.length} hidden</span>
              <span>Run scan again to refresh</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";

const INDUSTRY_COMPANIES = {
  "Tech": [
    { name: "Google", domain: "google.com" },
    { name: "Microsoft", domain: "microsoft.com" },
    { name: "Apple", domain: "apple.com" },
    { name: "Meta", domain: "meta.com" },
    { name: "Salesforce", domain: "salesforce.com" },
    { name: "HubSpot", domain: "hubspot.com" },
    { name: "Datadog", domain: "datadoghq.com" },
    { name: "Cloudflare", domain: "cloudflare.com" },
    { name: "Twilio", domain: "twilio.com" },
    { name: "Stripe", domain: "stripe.com" },
  ],
  "Gaming / iGaming": [
    { name: "DraftKings", domain: "draftkings.com" },
    { name: "FanDuel", domain: "fanduel.com" },
    { name: "Penn Entertainment", domain: "pennentertainment.com" },
    { name: "Caesars", domain: "caesars.com" },
    { name: "MGM Resorts", domain: "mgmresorts.com" },
  ],
  "Finance": [
    { name: "Fidelity", domain: "fidelity.com" },
    { name: "BlackRock", domain: "blackrock.com" },
    { name: "State Street", domain: "statestreet.com" },
    { name: "Wellington", domain: "wellington.com" },
    { name: "Putnam", domain: "putnam.com" },
    { name: "Vanguard", domain: "vanguard.com" },
    { name: "Charles Schwab", domain: "schwab.com" },
    { name: "JP Morgan", domain: "jpmorgan.com" },
  ],
  "E-Commerce / Retail": [
    { name: "Amazon", domain: "amazon.com" },
    { name: "Wayfair", domain: "wayfair.com" },
    { name: "Chewy", domain: "chewy.com" },
    { name: "TJX", domain: "tjx.com" },
    { name: "Staples", domain: "staples.com" },
    { name: "CarGurus", domain: "cargurus.com" },
  ],
  "CPG / Apparel": [
    { name: "LEGO", domain: "lego.com" },
    { name: "New Balance", domain: "newbalance.com" },
    { name: "Converse Nike", domain: "converse.com" },
    { name: "Reebok", domain: "reebok.com" },
    { name: "Hasbro", domain: "hasbro.com" },
    { name: "PTC", domain: "ptc.com" },
  ],
  "Food & Hospitality": [
    { name: "Toast", domain: "toasttab.com" },
    { name: "Dunkin", domain: "dunkindonuts.com" },
    { name: "Aramark", domain: "aramark.com" },
    { name: "Drizly", domain: "drizly.com" },
  ],
  "Healthcare / Biotech": [
    { name: "Mass General Brigham", domain: "massgeneralbrigham.org" },
    { name: "Biogen", domain: "biogen.com" },
    { name: "Moderna", domain: "moderna.com" },
    { name: "Veeva", domain: "veeva.com" },
    { name: "Tempus", domain: "tempus.com" },
    { name: "Hologic", domain: "hologic.com" },
  ],
  "Consulting / Professional Services": [
    { name: "Bain", domain: "bain.com" },
    { name: "BCG", domain: "bcg.com" },
    { name: "Accenture", domain: "accenture.com" },
    { name: "Deloitte", domain: "deloitte.com" },
    { name: "EY", domain: "ey.com" },
    { name: "KPMG", domain: "kpmg.com" },
  ],
};

const PRESET_JOB_TYPES = [
  "Operations Analyst", "Business Analyst", "Program Manager", "Project Manager",
  "Supply Chain Analyst", "Strategy & Operations", "BizOps Analyst",
  "Data Analyst", "Product Operations", "Revenue Operations",
  "Logistics Coordinator", "Process Improvement Analyst", "Chief of Staff",
  "Operations Manager", "Business Operations Manager", "Demand Planning Analyst",
  "Inventory Analyst", "Procurement Analyst", "Category Manager",
];

const LEVELS = ["Entry-level", "Mid-level", "Senior"];
const LOCATIONS = ["Boston", "Remote", "Both"];
const KEYWORDS = ["operations","analyst","program manager","project manager","supply chain","strategy","bizops","business operations","planning","process","sql","excel","stakeholder","workflow","metrics"];

function scoreJob(title, snippet) {
  const text = (title + " " + snippet).toLowerCase();
  return KEYWORDS.filter(kw => text.includes(kw)).length;
}

export default function JobRadar() {
  const defaultCompanies = [
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

  const [myCompanies, setMyCompanies] = useState(defaultCompanies);
  const [companySearch, setCompanySearch] = useState("");
  const [expandedIndustry, setExpandedIndustry] = useState(null);
  const [myJobTypes, setMyJobTypes] = useState(["Operations Analyst","Business Analyst","Program Manager","Supply Chain Analyst","Strategy & Operations"]);
  const [jobTypeInput, setJobTypeInput] = useState("");
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
  const [activeTab, setActiveTab] = useState("companies");

  const addCompany = (company) => {
    if (!myCompanies.find(c => c.name === company.name)) {
      setMyCompanies(prev => [...prev, company]);
    }
  };

  const removeCompany = (name) => setMyCompanies(prev => prev.filter(c => c.name !== name));

  const addCustomCompany = () => {
    const name = companySearch.trim();
    if (!name) return;
    const domain = name.toLowerCase().replace(/\s+/g, "") + ".com";
    addCompany({ name, domain });
    setCompanySearch("");
  };

  const addJobType = (j) => {
    if (!myJobTypes.includes(j)) setMyJobTypes(prev => [...prev, j]);
  };

  const addCustomJobType = () => {
    const j = jobTypeInput.trim();
    if (!j || myJobTypes.includes(j)) return;
    setMyJobTypes(prev => [...prev, j]);
    setJobTypeInput("");
  };

  const toggleLevel = (l) => setActiveLevel(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const runScan = useCallback(async () => {
    setLoading(true);
    setResults([]);
    setProgress(0);
    setScannedCount(0);

    for (let i = 0; i < myCompanies.length; i++) {
      const company = myCompanies[i];
      setScanning(company.name);
      setProgress(Math.round((i / myCompanies.length) * 100));
      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: company.name, jobTypes: myJobTypes, levels: activeLevel, location: activeLocation })
        });
        const data = await res.json();
        const scored = (data.jobs || []).map((j, idx) => ({
          ...j, id: company.name + "-" + idx, domain: company.domain,
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
  }, [myCompanies, myJobTypes, activeLevel, activeLocation]);

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

  const filteredPresets = PRESET_JOB_TYPES.filter(j =>
    !myJobTypes.includes(j) && j.toLowerCase().includes(jobTypeInput.toLowerCase())
  );

  const allIndustryCompanies = Object.values(INDUSTRY_COMPANIES).flat();
  const filteredIndustryCompanies = companySearch
    ? allIndustryCompanies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f3", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1a1a1a" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .card { background: white; border: 1px solid #e8e8e8; border-radius: 12px; transition: box-shadow 0.2s, transform 0.2s; }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
        .scan-btn { background: #1a1a1a; color: white; border: none; padding: 11px 0; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.15s; }
        .scan-btn:hover:not(:disabled) { background: #333; }
        .scan-btn:disabled { background: #ccc; cursor: not-allowed; }
        .progress-track { height: 3px; background: #f0f0f0; border-radius: 2px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; background: #1a1a1a; border-radius: 2px; transition: width 0.3s; }
        .pill { cursor: pointer; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 500; transition: all 0.15s; border: 1.5px solid #e8e8e8; background: white; color: #666; }
        .pill.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        .loc-btn { flex: 1; padding: 7px 0; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1.5px solid #e8e8e8; background: white; color: #666; cursor: pointer; transition: all 0.15s; }
        .loc-btn.on { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        .sidebar-label { font-size: 10px; font-weight: 700; color: #999; letter-spacing: 0.1em; margin-bottom: 10px; }
        .tab-btn { flex: 1; padding: 8px; border: none; background: none; font-size: 12px; font-weight: 500; color: #999; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .tab-btn.active { color: #1a1a1a; border-bottom-color: #1a1a1a; }
        .input-box { width: 100%; border: 1.5px solid #e8e8e8; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; font-family: inherit; }
        .input-box:focus { border-color: #1a1a1a; }
        .add-btn { background: #1a1a1a; color: white; border: none; border-radius: 6px; padding: 8px 12px; font-size: 12px; cursor: pointer; white-space: nowrap; font-family: inherit; }
        .chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f4f4f4; border-radius: 20px; font-size: 12px; color: #333; }
        .chip-x { cursor: pointer; color: #999; font-size: 14px; line-height: 1; }
        .chip-x:hover { color: #333; }
        .industry-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; cursor: pointer; font-size: 13px; font-weight: 600; color: #333; }
        .industry-header:hover { color: #000; }
        .company-item { display: flex; align-items: center; gap: 8px; padding: 6px 0 6px 8px; cursor: pointer; border-radius: 6px; }
        .company-item:hover { background: #f8f8f6; }
        .add-circle { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999; flex-shrink: 0; transition: all 0.15s; }
        .company-item:hover .add-circle { border-color: #1a1a1a; color: #1a1a1a; }
        .added-circle { width: 20px; height: 20px; border-radius: 50%; background: #e8f5e9; border: 1.5px solid #a5d6a7; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #2e7d32; flex-shrink: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn 0.3s ease; }
        @keyframes blink { 50% { opacity: 0; } }
        .blink { animation: blink 1s step-end infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }
      `}</style>

      {/* Top nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e8e8e8", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Job Radar</span>
          <span style={{ fontSize: 12, color: "#bbb", marginLeft: 10 }}>Matthew Dresser · Boston + Remote</span>
        </div>
        {lastScanned && !loading && (
          <div style={{ fontSize: 11, color: "#bbb" }}>Last scan: {lastScanned.toLocaleTimeString()}</div>
        )}
      </div>

      <div style={{ display: "flex", maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>

        {/* Sidebar */}
        <div style={{ width: 280, flexShrink: 0, padding: "24px 0", marginRight: 28 }}>
          <div style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 14, overflow: "hidden", position: "sticky", top: 72 }}>

            {/* Scan button */}
            <div style={{ padding: "20px 20px 0" }}>
              <button className="scan-btn" onClick={runScan} disabled={loading}>
                {loading ? "Scanning " + progress + "%" : "▶ Run Scan"}
              </button>
              {loading && (
                <div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: progress + "%" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 6, paddingBottom: 4 }}>
                    Scanning {scanning}<span className="blink">...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", marginTop: 16 }}>
              {["companies", "roles", "filters"].map(t => (
                <button key={t} className={"tab-btn" + (activeTab === t ? " active" : "")} onClick={() => setActiveTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ padding: "16px 20px", maxHeight: 520, overflowY: "auto" }}>

              {/* COMPANIES TAB */}
              {activeTab === "companies" && (
                <div>
                  <div className="sidebar-label">MY COMPANIES ({myCompanies.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {myCompanies.map(c => (
                      <div key={c.name} className="chip">
                        <img src={"https://logo.clearbit.com/" + c.domain} width={14} height={14} style={{ borderRadius: 3 }} onError={e => e.target.style.display = "none"} />
                        {c.name}
                        <span className="chip-x" onClick={() => removeCompany(c.name)}>×</span>
                      </div>
                    ))}
                  </div>

                  <div className="sidebar-label">ADD COMPANIES</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    <input
                      className="input-box"
                      placeholder="Search or add any company..."
                      value={companySearch}
                      onChange={e => setCompanySearch(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomCompany()}
                    />
                    <button className="add-btn" onClick={addCustomCompany}>Add</button>
                  </div>

                  {/* Search results */}
                  {companySearch && filteredIndustryCompanies && (
                    <div style={{ marginBottom: 16 }}>
                      {filteredIndustryCompanies.slice(0, 6).map(c => (
                        <div key={c.name} className="company-item" onClick={() => addCompany(c)}>
                          {myCompanies.find(x => x.name === c.name)
                            ? <div className="added-circle">✓</div>
                            : <div className="add-circle">+</div>}
                          <img src={"https://logo.clearbit.com/" + c.domain} width={18} height={18} style={{ borderRadius: 4 }} onError={e => e.target.style.display = "none"} />
                          <span style={{ fontSize: 13 }}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Industry browse */}
                  {!companySearch && (
                    <div>
                      <div className="sidebar-label">BROWSE BY INDUSTRY</div>
                      {Object.entries(INDUSTRY_COMPANIES).map(([industry, companies]) => (
                        <div key={industry} style={{ marginBottom: 4 }}>
                          <div className="industry-header" onClick={() => setExpandedIndustry(expandedIndustry === industry ? null : industry)}>
                            <span>{industry}</span>
                            <span style={{ color: "#bbb", fontSize: 12 }}>{expandedIndustry === industry ? "▲" : "▼"}</span>
                          </div>
                          {expandedIndustry === industry && (
                            <div style={{ paddingBottom: 8 }}>
                              {companies.map(c => (
                                <div key={c.name} className="company-item" onClick={() => addCompany(c)}>
                                  {myCompanies.find(x => x.name === c.name)
                                    ? <div className="added-circle">✓</div>
                                    : <div className="add-circle">+</div>}
                                  <img src={"https://logo.clearbit.com/" + c.domain} width={18} height={18} style={{ borderRadius: 4 }} onError={e => e.target.style.display = "none"} />
                                  <span style={{ fontSize: 13 }}>{c.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ROLES TAB */}
              {activeTab === "roles" && (
                <div>
                  <div className="sidebar-label">MY JOB TYPES ({myJobTypes.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {myJobTypes.map(j => (
                      <div key={j} className="chip">
                        {j}
                        <span className="chip-x" onClick={() => setMyJobTypes(p => p.filter(x => x !== j))}>×</span>
                      </div>
                    ))}
                  </div>

                  <div className="sidebar-label">ADD CUSTOM TITLE</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    <input
                      className="input-box"
                      placeholder="e.g. Chief of Staff..."
                      value={jobTypeInput}
                      onChange={e => setJobTypeInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomJobType()}
                    />
                    <button className="add-btn" onClick={addCustomJobType}>Add</button>
                  </div>

                  <div className="sidebar-label">SUGGESTED ROLES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {filteredPresets.map(j => (
                      <div key={j} className="company-item" onClick={() => addJobType(j)}>
                        <div className="add-circle">+</div>
                        <span style={{ fontSize: 13 }}>{j}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FILTERS TAB */}
              {activeTab === "filters" && (
                <div>
                  <div className="sidebar-label" style={{ marginBottom: 12 }}>EXPERIENCE LEVEL</div>
                  {LEVELS.map(l => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer" }} onClick={() => toggleLevel(l)}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid " + (activeLevel.includes(l) ? "#1a1a1a" : "#ddd"), background: activeLevel.includes(l) ? "#1a1a1a" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {activeLevel.includes(l) && <span style={{ color: "white", fontSize: 10 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13 }}>{l}</span>
                    </div>
                  ))}

                  <div style={{ borderTop: "1px solid #f0f0f0", margin: "20px 0" }} />

                  <div className="sidebar-label" style={{ marginBottom: 12 }}>LOCATION</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {LOCATIONS.map(l => (
                      <button key={l} className={"loc-btn" + (activeLocation === l ? " on" : "")} onClick={() => setActiveLocation(l)}>{l}</button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "24px 0" }}>

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
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>{myCompanies.length} companies · {myJobTypes.length} job types</div>
            </div>
          )}

          {/* Job cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map(job => (
              <div key={job.id} className="card fade" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ display: "flex", gap: 14, flex: 1 }}>
                    <img src={"https://logo.clearbit.com/" + job.domain} alt={job.company} width={40} height={40} style={{ borderRadius: 8, objectFit: "contain", flexShrink: 0, marginTop: 2, background: "#f8f8f6" }} onError={e => e.target.style.display = "none"} />
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
    </div>
  );
}

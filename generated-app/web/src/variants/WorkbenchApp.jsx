/**
 * Option C — Analyst Workbench (light theme)
 */
import React, { useState, useCallback } from "react";
import {
  getDemoClient, generateRecommendations, listRecommendations,
  getDocuments, getFields, getExportPackage,
} from "../api.js";
import { HelpTip } from "../components/HelpTip.jsx";
import { Tour }    from "../components/Tour.jsx";
import { GLOSSARY, TIPS } from "../data/glossary.js";
import {
  scoreColor, fmtMoney, RULE_META,
  ScoreBadge, EmptyState, PrimaryBtn,
  EvidenceDrawer, NarrativePanel, Toast,
} from "../components/shared.jsx";
import { Logo } from "../main.jsx";

function SectionHead({ title, sub, tip, right }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#111827" }}>{title}</h2>
        {tip && <HelpTip tip={tip} />}
        {right && <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>{right}</div>}
      </div>
      {sub && <p style={{ color: "#6b7280", fontSize: 14, margin: 0, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function GlossaryPanel({ open, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = GLOSSARY.filter((g) =>
    g.term.toLowerCase().includes(search.toLowerCase()) ||
    g.definition.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ position: "fixed", bottom: 0, left: 200, right: 0, height: open ? 248 : 0, overflow: "hidden", transition: "height 0.28s ease", background: "#1e293b", zIndex: 150, borderTop: open ? "2px solid #334155" : "none" }}>
      {open && (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: "1px solid #334155", flexShrink: 0 }}>
            <span style={{ color: "#93c5fd", fontWeight: 700, fontSize: 13 }}>Glossary</span>
            <HelpTip tip={{ title: "Glossary", what: "12 key underwriting terms used throughout this workbench.", why: "Underwriting has specialised vocabulary — this panel provides instant definitions.", next: "Search any term or hover the ? icons for inline explainers." }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search terms…"
              style={{ flex: 1, background: "#334155", border: "none", borderRadius: 6, padding: "4px 10px", color: "#f1f5f9", fontSize: 13, outline: "none" }} />
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", height: "100%" }}>
              {filtered.map((g) => (
                <div key={g.term} style={{ flexShrink: 0, width: 196, padding: "10px 12px", background: "#334155", borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#93c5fd", marginBottom: 5 }}>{g.term}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>{g.definition}</div>
                </div>
              ))}
              {!filtered.length && <div style={{ color: "#64748b", fontSize: 13, display: "flex", alignItems: "center", paddingLeft: 4 }}>No terms match "{search}"</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ client, onLoad, loading }) {
  return (
    <div>
      <SectionHead title="Client Profile" sub="Qualitative borrower context — the lens through which all quantitative signals are interpreted." tip={TIPS["Client"]}
        right={<PrimaryBtn dataTour="load-demo-client" onClick={onLoad} loading={loading}>Load Demo Client</PrimaryBtn>}
      />
      {!client ? (
        <EmptyState icon="👤" title="No client loaded" sub="Click 'Load Demo Client' to load the seeded demo borrower." />
      ) : (
        <div data-tour="client-profile" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "22px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 3 }}>{client.name}</div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", fontFamily: "monospace" }}>id: {client.id}</div>
            </div>
            <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>DEMO BORROWER</span>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Bio</div>
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{client.bio}</p>
          </div>
          {client.goals_json && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Goals</span>
                <HelpTip tip={{ title: "Borrower Goals", what: "Stated objectives and context provided by the borrower.", why: "Goals inform which recommendations carry the most relevance.", next: "Use goal context alongside the scored recommendations." }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(client.goals_json).map(([k, v]) => (
                  <span key={k} style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 500 }}>
                    <b>{k.replace(/_/g, " ")}</b>: {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentsSection({ docs }) {
  return (
    <div>
      <SectionHead title="Source Documents" sub="Financial filings ingested for this client. Every recommendation traces back to one of these documents." tip={TIPS["Document"]} />
      {!docs.length ? <EmptyState icon="📄" title="No documents loaded" sub="Load a demo client first." /> : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[["Doc Type", TIPS["doc_type"]], ["Tax Year", null], ["Entity", null], ["Document ID", null], ["Ingested", null]].map(([h, tip]) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <span style={{ display: "inline-flex", alignItems: "center" }}>{h}{tip && <HelpTip tip={tip} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ background: d.doc_type === "K1" ? "#dbeafe" : "#f3e8ff", color: d.doc_type === "K1" ? "#1d4ed8" : "#7c3aed", borderRadius: 5, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{d.doc_type}</span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontWeight: 600 }}>{d.tax_year ?? "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", color: "#374151", fontSize: 13 }}>{d.payload_json?.entity ?? "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace", fontSize: 11.5, color: "#9ca3af" }}>{d.id.slice(0, 14)}…</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", color: "#6b7280", fontSize: 13 }}>{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FieldsSection({ fields }) {
  return (
    <div>
      <SectionHead title="Extracted Fields" sub="Normalised key-value pairs parsed from source documents. These are the exact inputs the rules engine reads." tip={TIPS["Extracted Fields"]} />
      {!fields.length ? <EmptyState icon="🔢" title="No fields loaded" sub="Load a demo client first." /> : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[["Field Key", TIPS["Field Key"]], ["Label", null], ["Value (Numeric)", null], ["Doc Type", TIPS["doc_type"]], ["Tax Year", null]].map(([h, tip]) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <span style={{ display: "inline-flex", alignItems: "center" }}>{h}{tip && <HelpTip tip={tip} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace", fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>{f.field_key}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{f.field_label}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", fontWeight: 700 }}>{f.value_num != null ? fmtMoney(f.value_num) : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ background: f.doc_type === "K1" ? "#dbeafe" : "#f3e8ff", color: f.doc_type === "K1" ? "#1d4ed8" : "#7c3aed", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{f.doc_type}</span>
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{f.tax_year ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecommendationsSection({ client, recs, onGenerate, onOpenDrawer, loading }) {
  return (
    <div>
      <SectionHead title="Recommendations" sub="Rules engine output — scored, ranked, and fully explainable findings about this client." tip={TIPS["Recommendation"]}
        right={<PrimaryBtn dataTour="generate-recommendations" onClick={onGenerate} disabled={!client || loading} loading={loading}>Generate Recommendations</PrimaryBtn>}
      />
      {!recs.length ? (
        <EmptyState icon="⚙️" title="No recommendations yet" sub="Load a client then click 'Generate Recommendations'." />
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>{recs.length} recommendation{recs.length !== 1 ? "s" : ""} · ranked by score</span>
            <HelpTip tip={TIPS["Score"]} />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {recs.map((r, i) => {
              const meta = RULE_META[r.rule_id] ?? { label: r.rule_id, tip: null };
              return (
                <div key={r.id} data-tour={i === 0 ? "open-evidence" : undefined} className="rec-card" onClick={() => onOpenDrawer(r)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700 }}>#{i + 1}</span>
                        <span style={{ background: "#f3f4f6", color: "#374151", borderRadius: 5, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{meta.label}</span>
                        {meta.tip && <HelpTip tip={meta.tip} />}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{r.title}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <ScoreBadge score={r.score} />
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>click for evidence</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, color: "#374151", fontSize: 13.5, lineHeight: 1.65 }}>{r.insight}</div>
                  <div style={{ marginTop: 12, background: "#f3f4f6", borderRadius: 4, height: 5, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, Number(r.score))}%`, height: "100%", background: scoreColor(r.score), borderRadius: 4, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <NarrativePanel client={client} recs={recs} />
        </>
      )}
    </div>
  );
}

function ExportSection({ client, exportPkg, onExport, loading }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!exportPkg) return;
    navigator.clipboard.writeText(JSON.stringify(exportPkg, null, 2)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };
  return (
    <div>
      <SectionHead title="Export Package" sub="Generate a portable JSON bundle: client profile + all ranked recommendations + evidence traces." tip={TIPS["Export Package"]}
        right={<PrimaryBtn onClick={onExport} disabled={!client || loading} loading={loading} color="#16a34a">Generate Export</PrimaryBtn>}
      />
      {!exportPkg ? <EmptyState icon="📦" title="No export yet" sub="Click 'Generate Export' to build the package." /> : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <button onClick={copy} style={{ background: copied ? "#16a34a" : "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✓ Copied!" : "Copy to Clipboard"}
            </button>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>generated_at: {exportPkg.generated_at}</span>
          </div>
          <div style={{ background: "#0f172a", color: "#a5f3fc", borderRadius: 10, padding: "18px 22px", overflow: "auto", maxHeight: 480, fontSize: 12, fontFamily: "monospace", lineHeight: 1.65, border: "1px solid #1e293b" }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(exportPkg, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditSection() {
  return (
    <div>
      <SectionHead title="Audit Trail" sub="Timestamped log of all system events: ingestion, generation, and export actions." tip={TIPS["Audit Trail"]} />
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "40px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Audit Trail — Coming Soon</div>
        <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.7 }}>
          In production, this view shows a timestamped log of every system action: ingestion, recommendation generation, export creations, and field-level change history.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {["DOC_INGESTED", "RECS_GENERATED", "EXPORT_CREATED", "FIELD_UPDATED"].map((ev) => (
            <span key={ev} style={{ background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "5px 11px", fontSize: 12, fontWeight: 600 }}>{ev}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { id: "profile",         icon: "👤", label: "Profile" },
  { id: "documents",       icon: "📄", label: "Documents",       tour: "nav-documents" },
  { id: "fields",          icon: "🔢", label: "Fields",          tour: "nav-fields" },
  { id: "recommendations", icon: "⚙️", label: "Recommendations" },
  { id: "export",          icon: "📦", label: "Export",          tour: "export-package" },
  { id: "audit",           icon: "🔍", label: "Audit" },
];

export function WorkbenchApp({ switcher }) {
  const [client,       setClient]       = useState(null);
  const [docs,         setDocs]         = useState([]);
  const [fields,       setFields]       = useState([]);
  const [recs,         setRecs]         = useState([]);
  const [activeNav,    setActiveNav]    = useState("profile");
  const [drawerRec,    setDrawerRec]    = useState(null);
  const [toast,        setToast]        = useState(null);
  const [tourRunning,  setTourRunning]  = useState(false);
  const [exportPkg,    setExportPkg]    = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const showToast = useCallback((msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const loadClient = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getDemoClient();
      setClient(c);
      const [d, f] = await Promise.all([getDocuments(c.id), getFields(c.id)]);
      setDocs(d.documents ?? []);
      setFields(f.fields ?? []);
      showToast(`Demo client loaded — ${d.documents?.length ?? 0} docs · ${f.fields?.length ?? 0} fields`);
      return c;
    } catch (e) { showToast("Error: " + e.message, "error"); return null; }
    finally { setLoading(false); }
  }, [showToast]);

  const runGenerate = useCallback(async (explicitClient) => {
    const clientId = (explicitClient ?? client)?.id;
    if (!clientId) return [];
    setLoading(true);
    try {
      await generateRecommendations(clientId);
      const list = await listRecommendations(clientId);
      const newRecs = list.recommendations ?? [];
      setRecs(newRecs);
      showToast(`${newRecs.length} recommendation${newRecs.length !== 1 ? "s" : ""} generated`);
      setActiveNav("recommendations");
      return newRecs;
    } catch (e) { showToast("Error: " + e.message, "error"); return []; }
    finally { setLoading(false); }
  }, [client, showToast]);

  const openExport = useCallback(async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const pkg = await getExportPackage(client.id);
      setExportPkg(pkg);
      showToast("Export package generated");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    finally { setLoading(false); }
  }, [client, showToast]);

  const handleTourStep = useCallback((index) => {
    const navMap = ["profile", "profile", "documents", "fields", "recommendations", "recommendations", "export"];
    if (navMap[index]) setActiveNav(navMap[index]);
  }, []);

  const startTour = useCallback(async () => {
    let c = client;
    if (!c) c = await loadClient();
    if (!c) return;
    let r = recs;
    if (!r.length) r = await runGenerate(c);
    setActiveNav("profile");
    setTourRunning(false);
    setTimeout(() => setTourRunning(true), 180);
  }, [client, recs, loadClient, runGenerate]);

  return (
    <>
      <Tour run={tourRunning} onFinish={() => setTourRunning(false)} onStepChange={handleTourStep} />

      {/* Top Bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 64, background: "#1d4ed8", display: "flex", alignItems: "center", padding: "0 20px", zIndex: 100, gap: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.01em" }}>Underwriting Analytics</div>
        <span style={{ background: "#3b5998", color: "#bfdbfe", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>C · Workbench</span>
        <div style={{ flex: 1 }} />
        <div style={{ background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, color: "#fef9c3", display: "flex", alignItems: "center", gap: 5 }}>
          <span>🟡</span><span>DEMO MODE</span>
          <HelpTip tip={{ title: "Demo Mode", what: "All data in this session is seeded — not from real filings.", why: "Demo mode lets you explore the full workflow without uploading real documents.", next: "Click 'Load Demo Client' to populate every section." }} />
        </div>
        <button onClick={() => setGlossaryOpen((o) => !o)} style={{ background: "rgba(255,255,255,0.11)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff", borderRadius: 6, padding: "5px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Glossary</button>
        <button onClick={startTour} style={{ background: "rgba(255,255,255,0.11)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff", borderRadius: 6, padding: "5px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>▶ Start Tour</button>
        {switcher}
        {/* Logo top-right — white bg so black logo reads on blue bar */}
        <div style={{ background: "#fff", borderRadius: 7, padding: "2px 6px", marginLeft: 6, display: "flex", alignItems: "center" }}>
          <Logo height={50} />
        </div>
      </div>

      {/* Left Nav */}
      <div style={{ position: "fixed", top: 64, left: 0, bottom: 0, width: 200, background: "#1e293b", zIndex: 90, display: "flex", flexDirection: "column", paddingTop: 10, overflowY: "auto" }}>
        {NAV.map((item) => {
          const active = activeNav === item.id;
          return (
            <div key={item.id} data-tour={item.tour} onClick={() => setActiveNav(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", cursor: "pointer", color: active ? "#93c5fd" : "#94a3b8", fontWeight: active ? 600 : 500, fontSize: 14, borderLeft: `3px solid ${active ? "#93c5fd" : "transparent"}`, background: active ? "rgba(29,78,216,0.2)" : "transparent", transition: "all 0.12s" }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#e2e8f0"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "recommendations" && recs.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#1d4ed8", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{recs.length}</span>
              )}
            </div>
          );
        })}
        {client && (
          <div style={{ marginTop: "auto", padding: "12px 14px" }}>
            <div style={{ background: "#334155", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Active Client</div>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{client.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{recs.length} rec{recs.length !== 1 ? "s" : ""} · {docs.length} docs · {fields.length} fields</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ marginTop: 64, marginLeft: 200, padding: "30px 34px", minHeight: "calc(100vh - 64px)", maxWidth: 940, paddingBottom: glossaryOpen ? 268 : 48 }}>
        {activeNav === "profile"         && <ProfileSection         client={client} onLoad={loadClient} loading={loading} />}
        {activeNav === "documents"       && <DocumentsSection       docs={docs} />}
        {activeNav === "fields"          && <FieldsSection          fields={fields} />}
        {activeNav === "recommendations" && <RecommendationsSection client={client} recs={recs} onGenerate={() => runGenerate()} onOpenDrawer={setDrawerRec} loading={loading} />}
        {activeNav === "export"          && <ExportSection          client={client} exportPkg={exportPkg} onExport={openExport} loading={loading} />}
        {activeNav === "audit"           && <AuditSection />}
      </div>

      <EvidenceDrawer rec={drawerRec} onClose={() => setDrawerRec(null)} />
      <Toast toast={toast} />
      <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </>
  );
}

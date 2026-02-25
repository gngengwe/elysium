/**
 * Option B — Wizard Flow (light theme)
 */
import React, { useState } from "react";
import { HelpTip } from "../components/HelpTip.jsx";
import { TIPS } from "../data/glossary.js";
import {
  ScoreBadge, EmptyState, PrimaryBtn, EvidenceDrawer, NarrativePanel, Toast, fmtMoney,
} from "../components/shared.jsx";
import {
  getDemoClient, generateRecommendations, listRecommendations,
  getDocuments, getFields, getExportPackage,
} from "../api.js";
import { Logo } from "../main.jsx";

const STEPS = [
  { title: "Load Client",      icon: "🏦", tipKey: "Client",          instruction: "Load the demo borrower to seed all subsequent steps with real extracted data from K-1 and 1040 filings." },
  { title: "Review Documents", icon: "📄", tipKey: "Document",        instruction: "Review the source financial filings ingested for this client. Each document type activates specific underwriting rules." },
  { title: "Review Fields",    icon: "🔑", tipKey: "Extracted Fields", instruction: "Inspect the normalised key-value fields extracted from each document. These are the canonical inputs the rules engine reads." },
  { title: "Generate & Review", icon: "⚡", tipKey: "Rules Engine",   instruction: "Run the three deterministic rules to produce scored, ranked recommendations. Click any card to see its evidence and arithmetic." },
  { title: "Export Package",   icon: "📦", tipKey: "Export Package",   instruction: "Generate the portable JSON handoff bundle — client profile, ranked recommendations, and full evidence traces." },
];

export function WizardApp({ switcher }) {
  const [step,      setStep]      = useState(0);
  const [client,    setClient]    = useState(null);
  const [docs,      setDocs]      = useState([]);
  const [fields,    setFields]    = useState([]);
  const [recs,      setRecs]      = useState([]);
  const [exportPkg, setExportPkg] = useState(null);
  const [loading,   setLoading]   = useState({});
  const [toast,     setToast]     = useState(null);
  const [drawer,    setDrawer]    = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const busy = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  const isComplete = [!!client, !!client && docs.length > 0, !!client && fields.length > 0, recs.length > 0, !!exportPkg];
  const canNext = isComplete[step];
  const canBack = step > 0;
  const goNext  = () => { if (canNext && step < 4) setStep((s) => s + 1); };
  const goBack  = () => { if (canBack) setStep((s) => s - 1); };

  const loadClient = async () => {
    busy("client", true);
    try {
      const client = await getDemoClient();
      setClient(client);
      const [docsData, fieldsData] = await Promise.all([getDocuments(client.id), getFields(client.id)]);
      setDocs(docsData.documents ?? []);
      setFields(fieldsData.fields ?? []);
      showToast("Demo client loaded");
    } catch (e) { showToast(e.message, "error"); }
    finally { busy("client", false); }
  };

  const generateRecs = async () => {
    if (!client) return;
    busy("recs", true);
    try {
      await generateRecommendations(client.id);
      const data = await listRecommendations(client.id);
      setRecs(data.recommendations ?? []);
      showToast("Recommendations generated");
    } catch (e) { showToast(e.message, "error"); }
    finally { busy("recs", false); }
  };

  const loadExport = async () => {
    if (!client) return;
    busy("export", true);
    try {
      const data = await getExportPackage(client.id);
      setExportPkg(data);
      showToast("Export package ready");
    } catch (e) { showToast(e.message, "error"); }
    finally { busy("export", false); }
  };

  const s = STEPS[step];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Top Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: "#fef9c3", color: "#713f12", borderRadius: 5, padding: "2px 7px" }}>DEMO</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Wizard Flow</span>
        <div style={{ flex: 1 }} />
        {switcher}
        <Logo height={55} style={{ marginLeft: 8 }} />
      </div>

      {/* Stepper */}
      <Stepper steps={STEPS} current={step} complete={isComplete} onStepClick={setStep} />

      {/* Body: 65/35 split */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Main */}
        <div style={{ flex: "1 1 0%", minWidth: 0 }}>
          {step === 0 && <Step1Load  client={client} loading={loading} onLoad={loadClient} />}
          {step === 1 && <Step2Docs  docs={docs} client={client} />}
          {step === 2 && <Step3Fields fields={fields} client={client} />}
          {step === 3 && <Step4Generate recs={recs} client={client} loading={loading} onGenerate={generateRecs} onOpenDrawer={setDrawer} />}
          {step === 4 && <Step5Export exportPkg={exportPkg} client={client} loading={loading} onLoad={loadExport} />}
        </div>

        {/* Coach Panel */}
        <div style={{ width: 280, flexShrink: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "22px 20px", position: "sticky", top: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step {step + 1} of {STEPS.length}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 12 }}>{s.title}</div>
          <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7, margin: "0 0 14px 0" }}>{s.instruction}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
            <HelpTip tip={TIPS[s.tipKey]} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Learn more about {s.tipKey}</span>
          </div>
          <div style={{ marginBottom: 22 }}>
            {isComplete[step]
              ? <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>✓ Step complete</span>
              : <span style={{ background: "#f3f4f6", color: "#6b7280", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>Incomplete</span>
            }
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={goBack} disabled={!canBack} style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 600, background: canBack ? "#f3f4f6" : "#f9fafb", color: canBack ? "#374151" : "#d1d5db", border: "1px solid #e5e7eb", cursor: canBack ? "pointer" : "not-allowed" }}>← Back</button>
            {step < 4
              ? <button onClick={goNext} disabled={!canNext} style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 700, background: canNext ? "#1d4ed8" : "#e5e7eb", color: canNext ? "#fff" : "#9ca3af", border: "none", cursor: canNext ? "pointer" : "not-allowed" }}>Next →</button>
              : <button onClick={() => showToast("Analysis complete!", "success")} disabled={!isComplete[4]} style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 700, background: isComplete[4] ? "#16a34a" : "#e5e7eb", color: isComplete[4] ? "#fff" : "#9ca3af", border: "none", cursor: isComplete[4] ? "pointer" : "not-allowed" }}>✓ Finish</button>
            }
          </div>
        </div>
      </div>

      <EvidenceDrawer rec={drawer} onClose={() => setDrawer(null)} />
      <Toast toast={toast} />
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ steps, current, complete, onStepClick }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 28px", display: "flex", alignItems: "center", overflowX: "auto" }}>
      {steps.map((s, i) => {
        const done   = complete[i];
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <button onClick={() => onStepClick(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: done ? 14 : 13, fontWeight: 700, background: done ? "#1d4ed8" : active ? "#eff6ff" : "#f3f4f6", color: done ? "#fff" : active ? "#1d4ed8" : "#9ca3af", border: active ? "2px solid #1d4ed8" : done ? "2px solid #1d4ed8" : "2px solid #e5e7eb", transition: "all 0.2s" }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 500, color: active ? "#1d4ed8" : done ? "#374151" : "#9ca3af", whiteSpace: "nowrap" }}>{s.title}</span>
            </button>
            {i < steps.length - 1 && <div style={{ flex: "1 1 0%", height: 2, minWidth: 20, background: complete[i] ? "#1d4ed8" : "#e5e7eb", transition: "background 0.3s" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Shared table header ───────────────────────────────────────────────────────
function Th({ children }) {
  return <th style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: "#f9fafb" }}>{children}</th>;
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1Load({ client, loading, onLoad }) {
  return (
    <div>
      <h2 style={{ margin: "0 0 18px 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Load Demo Client</h2>
      {!client ? (
        <div style={{ background: "#fff", border: "2px dashed #bfdbfe", borderRadius: 14, padding: "52px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🏦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No client loaded yet</div>
          <div style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>
            Click below to load the seeded demo borrower. This calls <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 4 }}>GET /demo/client</code> and populates all steps.
          </div>
          <PrimaryBtn onClick={onLoad} loading={loading.client} style={{ fontSize: 14, padding: "10px 24px" }}>Load Demo Client</PrimaryBtn>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{client.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>ID: {client.id}</div>
            </div>
            <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>✓ Loaded</span>
          </div>
          {client.bio && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Bio</div><p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{client.bio}</p></div>}
          {client.goals && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Goals</div><p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{client.goals}</p></div>}
        </div>
      )}
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2Docs({ docs, client }) {
  if (!client) return <EmptyState icon="📄" title="No client loaded" sub="Go back to Step 1." />;
  if (!docs.length) return <EmptyState icon="📄" title="No documents" />;
  return (
    <div>
      <h2 style={{ margin: "0 0 18px 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Source Documents</h2>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead><tr>{["Tax Year", "Type", "Status", "File Name"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 16px", fontWeight: 700 }}>{d.tax_year}</td>
                <td style={{ padding: "10px 16px" }}><span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, padding: "2px 8px", fontSize: 11.5, fontWeight: 700 }}>{d.doc_type}</span></td>
                <td style={{ padding: "10px 16px" }}><span style={{ background: "#dcfce7", color: "#166534", borderRadius: 5, padding: "2px 8px", fontSize: 11.5, fontWeight: 600 }}>{d.status ?? "ingested"}</span></td>
                <td style={{ padding: "10px 16px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{d.file_name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3Fields({ fields, client }) {
  if (!client) return <EmptyState icon="🔑" title="No client loaded" sub="Go back to Step 1." />;
  if (!fields.length) return <EmptyState icon="🔑" title="No fields" />;
  return (
    <div>
      <h2 style={{ margin: "0 0 18px 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Extracted Fields</h2>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Year", "Type", "Field Key", "Label", "Value"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "9px 16px", color: "#6b7280" }}>{f.tax_year}</td>
                <td style={{ padding: "9px 16px" }}><span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>{f.doc_type}</span></td>
                <td style={{ padding: "9px 16px", fontFamily: "monospace", fontSize: 12, color: "#1d4ed8" }}>{f.field_key}</td>
                <td style={{ padding: "9px 16px", color: "#374151" }}>{f.field_label}</td>
                <td style={{ padding: "9px 16px", fontWeight: 700 }}>{f.value_num !== null && f.value_num !== undefined ? fmtMoney(f.value_num) : (f.value_text ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────────
function Step4Generate({ recs, client, loading, onGenerate, onOpenDrawer }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Generate & Review</h2>
        <PrimaryBtn onClick={onGenerate} disabled={!client} loading={loading.recs}>⚡ Generate</PrimaryBtn>
      </div>
      {!recs.length ? (
        <EmptyState icon="⚡" title="No recommendations yet" sub={client ? "Click Generate to run the rules engine." : "Load a client first."} />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recs.map((rec, i) => (
              <div key={rec.id} className="rec-card" onClick={() => onOpenDrawer(rec)} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44 }}>
                  <ScoreBadge score={rec.score} />
                  <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>#{i + 1}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4 }}><span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{rec.rule_id}</span></div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>{rec.title}</div>
                  <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.65 }}>{rec.insight}</div>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>Evidence →</span>
              </div>
            ))}
          </div>
          <NarrativePanel client={client} recs={recs} />
        </>
      )}
    </div>
  );
}

// ── Step 5 ────────────────────────────────────────────────────────────────────
function Step5Export({ exportPkg, client, loading, onLoad }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!exportPkg) return;
    navigator.clipboard.writeText(JSON.stringify(exportPkg, null, 2)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Export Package</h2>
        <PrimaryBtn onClick={onLoad} disabled={!client} loading={loading.export}>Generate Package</PrimaryBtn>
      </div>
      {!exportPkg ? (
        <EmptyState icon="📦" title="No export yet" sub={client ? "Click 'Generate Package'." : "Load a client first."} />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>export_package.json</span>
            <button onClick={copy} style={{ background: copied ? "#16a34a" : "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✓ Copied!" : "Copy JSON"}
            </button>
          </div>
          <pre style={{ margin: 0, padding: "18px 20px", fontSize: 12, lineHeight: 1.65, background: "#f8fafc", overflowX: "auto", maxHeight: 460, overflowY: "auto", color: "#374151" }}>
            {JSON.stringify(exportPkg, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

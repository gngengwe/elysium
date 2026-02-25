/**
 * Option A — Tour-First Dashboard (light theme)
 */
import React, { useState, useEffect, useCallback } from "react";
import Joyride, { STATUS } from "react-joyride";
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

const TOUR_STEPS = [
  { target: '[data-tab="overview"]',        title: "1 · Overview",         content: "Start here — click 'Load Demo Client' to populate all tabs with real extracted data.", disableBeacon: true, placement: "bottom" },
  { target: '[data-tab="documents"]',       title: "2 · Source Documents", content: "Source filings behind every recommendation. K1 and 1040 types activate the most rules.", disableBeacon: true, placement: "bottom" },
  { target: '[data-tab="fields"]',          title: "3 · Extracted Fields", content: "Normalised key-value inputs the rules engine reads. Keys like k1.distributions are canonical.", disableBeacon: true, placement: "bottom" },
  { target: '[data-tab="recommendations"]', title: "4 · Recommendations",  content: "Deterministic rules — fully explainable. Click any card to see its evidence and arithmetic.", disableBeacon: true, placement: "bottom" },
  { target: '[data-tab="export"]',          title: "5 · Export Package",   content: "The handoff artifact — a portable JSON bundle of the full analysis.", disableBeacon: true, placement: "bottom" },
  { target: '[data-btn="generate"]',        title: "6 · Generate",         content: "Click to run all three rules against the loaded client. Each output is scored 0–100 and ranked.", disableBeacon: true, placement: "bottom" },
];

const COACH = {
  overview:        { msg: "Start here — load the demo client to populate all tabs.",                                         tipKey: "Client" },
  documents:       { msg: "Source filings behind every recommendation. Each doc_type activates specific rules.",             tipKey: "Document" },
  fields:          { msg: "Normalised key-value inputs the rules engine reads. Keys like k1.distributions are canonical.",   tipKey: "Extracted Fields" },
  recommendations: { msg: "Deterministic rules — fully explainable. Click any card to see evidence.",                       tipKey: "Recommendation" },
  export:          { msg: "The handoff artifact — a portable JSON bundle of the full analysis.",                             tipKey: "Export Package" },
  audit:           { msg: "Compliance logging (stub). Production would log every system event.",                             tipKey: "Audit Trail" },
};

const TABS = ["overview", "documents", "fields", "recommendations", "export", "audit"];
const TAB_LABELS = { overview: "Overview", documents: "Documents", fields: "Fields", recommendations: "Recommendations", export: "Export", audit: "Audit" };

export function TourDashboardApp({ switcher }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [client,    setClient]    = useState(null);
  const [docs,      setDocs]      = useState([]);
  const [fields,    setFields]    = useState([]);
  const [recs,      setRecs]      = useState([]);
  const [exportPkg, setExportPkg] = useState(null);
  const [loading,   setLoading]   = useState({});
  const [toast,     setToast]     = useState(null);
  const [drawer,    setDrawer]    = useState(null);
  const [tourRun,   setTourRun]   = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("uw-tour-a-seen")) setTourRun(true);
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const busy = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

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

  const handleTourCallback = useCallback(({ index, type, status }) => {
    const tabMap = ["overview", "documents", "fields", "recommendations", "export", "recommendations"];
    if (type === "step:before" && tabMap[index]) setActiveTab(tabMap[index]);
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      sessionStorage.setItem("uw-tour-a-seen", "1");
      setTourRun(false);
    }
  }, []);

  const startTour = () => {
    setActiveTab("overview");
    setTourRun(false);
    setTimeout(() => setTourRun(true), 80);
  };

  const coach = COACH[activeTab] ?? COACH.overview;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Joyride
        steps={TOUR_STEPS} run={tourRun} continuous showProgress showSkipButton scrollToFirstStep disableOverlayClose
        styles={{
          options: { primaryColor: "#1d4ed8", backgroundColor: "#fff", textColor: "#111827", zIndex: 10000 },
          tooltip: { borderRadius: 12, boxShadow: "0 8px 36px rgba(0,0,0,0.18)", padding: "18px 22px", maxWidth: 340 },
          tooltipTitle: { fontSize: 15, fontWeight: 700, marginBottom: 8 },
          tooltipContent: { fontSize: 13.5, lineHeight: 1.6, color: "#374151" },
          buttonNext: { borderRadius: 7, fontSize: 13, fontWeight: 600, padding: "7px 16px" },
          buttonBack: { borderRadius: 7, fontSize: 13, color: "#6b7280" },
          buttonSkip: { fontSize: 12, color: "#9ca3af" },
          beacon: { display: "none" },
        }}
        callback={handleTourCallback}
      />

      {/* Top Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: "#fef9c3", color: "#713f12", borderRadius: 5, padding: "2px 7px" }}>DEMO</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Tour-First Dashboard</span>
        <button onClick={startTour} style={{ background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          ▶ Start Tour
        </button>
        <div style={{ flex: 1 }} />
        {switcher}
        {/* Logo top-right */}
        <Logo height={55} style={{ marginLeft: 8 }} />
      </div>

      {/* Tab Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", display: "flex" }}>
        {TABS.map((tab) => (
          <button key={tab} data-tab={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "12px 18px", fontSize: 13.5,
            fontWeight: activeTab === tab ? 700 : 500,
            color: activeTab === tab ? "#1d4ed8" : "#6b7280",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab ? "2px solid #1d4ed8" : "2px solid transparent",
            transition: "color 0.15s, border-color 0.15s",
          }}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Coach Strip */}
      <div style={{ background: "#eff6ff", borderBottom: "1px solid #bfdbfe", padding: "9px 24px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, color: "#3b82f6" }}>ⓘ</span>
        <span style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.4 }}>{coach.msg}</span>
        <HelpTip tip={TIPS[coach.tipKey]} />
      </div>

      {/* Main */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === "overview"        && <OverviewTab       client={client} loading={loading} onLoad={loadClient} />}
        {activeTab === "documents"       && <DocumentsTab      docs={docs} client={client} />}
        {activeTab === "fields"          && <FieldsTab         fields={fields} client={client} />}
        {activeTab === "recommendations" && <RecommendationsTab recs={recs} client={client} loading={loading} onGenerate={generateRecs} onOpenDrawer={setDrawer} />}
        {activeTab === "export"          && <ExportTab         exportPkg={exportPkg} client={client} loading={loading} onLoad={loadExport} />}
        {activeTab === "audit"           && <AuditTab />}
      </div>

      <EvidenceDrawer rec={drawer} onClose={() => setDrawer(null)} />
      <Toast toast={toast} />
    </div>
  );
}

// ── Shared table cells ────────────────────────────────────────────────────────
function Th({ children }) {
  return <th style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: "#f9fafb" }}>{children}</th>;
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ client, loading, onLoad }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Client Overview</h2>
        <HelpTip tip={TIPS["Client"]} />
      </div>
      {!client ? (
        <div style={{ textAlign: "center", padding: "60px 24px", border: "2px dashed #e5e7eb", borderRadius: 14, background: "#fff" }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>🏦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No client loaded</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>Load the demo client to populate all tabs.</div>
          <PrimaryBtn onClick={onLoad} loading={loading.client}>Load Demo Client</PrimaryBtn>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{client.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>ID: {client.id}</div>
            </div>
            <PrimaryBtn onClick={onLoad} loading={loading.client} style={{ fontSize: 12 }}>Refresh</PrimaryBtn>
          </div>
          {client.bio && <InfoBlock label="Bio" text={client.bio} />}
          {client.goals && <InfoBlock label="Goals" text={client.goals} />}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, text }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

// ── Documents ─────────────────────────────────────────────────────────────────
function DocumentsTab({ docs, client }) {
  if (!client) return <EmptyState icon="📄" title="No client loaded" sub="Load a client on the Overview tab first." />;
  if (!docs.length) return <EmptyState icon="📄" title="No documents" sub="No documents have been ingested yet." />;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Source Documents</h2>
        <HelpTip tip={TIPS["Document"]} />
      </div>
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

// ── Fields ────────────────────────────────────────────────────────────────────
function FieldsTab({ fields, client }) {
  if (!client) return <EmptyState icon="🔑" title="No client loaded" sub="Load a client on the Overview tab first." />;
  if (!fields.length) return <EmptyState icon="🔑" title="No fields" sub="No extracted fields found." />;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Extracted Fields</h2>
        <HelpTip tip={TIPS["Extracted Fields"]} />
      </div>
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

// ── Recommendations ───────────────────────────────────────────────────────────
function RecommendationsTab({ recs, client, loading, onGenerate, onOpenDrawer }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Recommendations</h2>
          <HelpTip tip={TIPS["Recommendation"]} />
        </div>
        <PrimaryBtn onClick={onGenerate} disabled={!client} loading={loading.recs} data-btn="generate">⚡ Generate</PrimaryBtn>
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

// ── Export ────────────────────────────────────────────────────────────────────
function ExportTab({ exportPkg, client, loading, onLoad }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!exportPkg) return;
    navigator.clipboard.writeText(JSON.stringify(exportPkg, null, 2)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Export Package</h2>
          <HelpTip tip={TIPS["Export Package"]} />
        </div>
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
          <pre style={{ margin: 0, padding: "18px 20px", fontSize: 12, lineHeight: 1.65, background: "#f8fafc", overflowX: "auto", maxHeight: 480, overflowY: "auto", color: "#374151" }}>
            {JSON.stringify(exportPkg, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Audit ─────────────────────────────────────────────────────────────────────
function AuditTab() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Audit Trail</h2>
        <HelpTip tip={TIPS["Audit Trail"]} />
      </div>
      <EmptyState icon="🔒" title="Audit log (stub)" sub="Production systems log every ingestion, generation, and export event here." />
    </div>
  );
}

/**
 * Shared atoms — light theme.
 */
import React, { useState } from "react";
import { HelpTip } from "./HelpTip.jsx";
import { TIPS } from "../data/glossary.js";

// ── colour / format helpers ───────────────────────────────────────────────────
export const scoreColor = (s) => s >= 70 ? "#16a34a" : s >= 50 ? "#ca8a04" : "#dc2626";
export const fmtMoney   = (n) => `$${Number(n).toLocaleString()}`;

// ── per-rule metadata ─────────────────────────────────────────────────────────
export const RULE_META = {
  "RULE-K1-NET-INCOME": { label: "K-1 Net Income", tip: TIPS["Rules Engine"] },
  "RULE-DEPR-ADD-BACK": {
    label: "Depreciation Add-back",
    tip: { title: "Depreciation Add-back", what: "Re-adds non-cash depreciation expenses to reported net income.", why: "Depreciation reduces taxable income but is not a cash outflow — adding it back reveals true cash earnings.", next: "Open the Evidence Drawer to see the exact arithmetic." },
  },
  "RULE-RECURRING-DIST": {
    label: "Recurring Distribution",
    tip: { title: "Recurring Distribution Heuristic", what: "Checks whether K-1 distributions are stable across two consecutive years.", why: "Recurring distributions signal consistent cash flow, a key factor in assessing repayment capacity.", next: "Check the ratio in Calculations — 0.75–1.35 is flagged as stable." },
  },
};

// ── ScoreBadge ────────────────────────────────────────────────────────────────
export function ScoreBadge({ score }) {
  const s = Number(score);
  return (
    <span style={{ background: scoreColor(s), color: "#fff", borderRadius: 6, padding: "3px 10px", fontWeight: 700, fontSize: 14, minWidth: 54, display: "inline-block", textAlign: "center" }}>
      {s.toFixed(1)}
    </span>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ padding: "52px 24px", textAlign: "center", color: "#6b7280", border: "2px dashed #e5e7eb", borderRadius: 12 }}>
      <div style={{ fontSize: 38, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );
}

// ── PrimaryBtn ────────────────────────────────────────────────────────────────
export function PrimaryBtn({ onClick, disabled, loading, children, dataTour, color, style }) {
  return (
    <button
      data-tour={dataTour}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: disabled || loading ? "#e5e7eb" : (color || "#1d4ed8"),
        color: disabled || loading ? "#9ca3af" : "#fff",
        border: "none", borderRadius: 7,
        padding: "7px 16px", fontWeight: 600, fontSize: 13,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "background 0.15s",
        ...style,
      }}
    >
      {loading ? "Working…" : children}
    </button>
  );
}

// ── EvidenceDrawer ────────────────────────────────────────────────────────────
export function EvidenceDrawer({ rec, onClose }) {
  if (!rec) return null;
  const evidence = Array.isArray(rec.evidence_json) ? rec.evidence_json : [];
  const calc = typeof rec.calculations_json === "object" && rec.calculations_json !== null ? rec.calculations_json : {};

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{rec.rule_id}</span>
              <ScoreBadge score={rec.score} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.4 }}>{rec.title}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9ca3af", padding: "0 0 0 12px", lineHeight: 1 }}>✕</button>
        </div>
        <div className="drawer-body">
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Insight</div>
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{rec.insight}</p>
          </div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Evidence</span>
              <HelpTip tip={TIPS["Evidence"]} />
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Year", "Field Key", "Value"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "7px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((ev, i) => (
                    <tr key={i}>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{ev.year}</td>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace", fontSize: 11.5, color: "#1d4ed8" }}>{ev.field}</td>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 700 }}>
                        {typeof ev.value === "number" ? fmtMoney(ev.value) : String(ev.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Calculations</span>
              <HelpTip tip={TIPS["Calculation Trace"]} />
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
              {Object.entries(calc).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: 12 }}>{k}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {typeof v === "boolean" ? String(v) : typeof v === "number" ? (k.includes("ratio") ? Number(v).toFixed(3) : fmtMoney(v)) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── NarrativePanel ────────────────────────────────────────────────────────────
export function NarrativePanel({ client, recs }) {
  const [copied, setCopied] = useState(false);
  if (!recs.length) return null;

  const top     = recs.slice(0, 3);
  const verdict = Number(recs[0]?.score ?? 0) >= 65 ? "stable and recurring" : "developing";
  const lines   = [
    `${client?.name ?? "The borrower"} presents a structured income profile derived from K-1 and tax return filings.`,
    ...top.map((r) => r.insight),
    `Taken together, these signals indicate a ${verdict} cash flow position supporting the requested credit facility.`,
  ];
  const narrative = lines.join(" ");

  const copy = () => {
    navigator.clipboard.writeText(narrative).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  return (
    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "16px 20px", marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#0c4a6e" }}>Narrative Builder</span>
        <HelpTip tip={{ title: "Narrative Builder", what: "Assembles recommendation insights into a readable underwriting summary.", why: "Loan officers need a narrative, not just scores — this bridges the gap.", next: "Click 'Copy Summary' to paste into a memo or CRM." }} />
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "#0c4a6e", margin: "0 0 12px 0" }}>{narrative}</p>
      <button onClick={copy} style={{ background: copied ? "#16a34a" : "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        {copied ? "✓ Copied!" : "Copy Summary"}
      </button>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success: "#16a34a", error: "#dc2626", info: "#1d4ed8" };
  const icons  = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className="toast" style={{ background: colors[toast.type] ?? "#1e293b" }}>
      <span>{icons[toast.type] ?? "•"}</span>
      <span>{toast.msg}</span>
    </div>
  );
}

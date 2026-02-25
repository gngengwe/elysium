/**
 * main.jsx
 * Screen flow:  Splash  →  Variant Picker  →  Variant App
 *
 * - Splash:  full-screen, big logo, click anywhere / button to continue
 * - Picker:  3 variant cards; choice persisted to localStorage
 * - Variant: each app receives a `switcher` prop to return to the picker
 */
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { WorkbenchApp }     from "./variants/WorkbenchApp.jsx";
import { TourDashboardApp } from "./variants/TourDashboardApp.jsx";
import { WizardApp }        from "./variants/WizardApp.jsx";
import "./styles.css";

const LS_KEY = "uw-variant";

// ── Shared Logo component ─────────────────────────────────────────────────────
// height controls rendered height; the image is native aspect-ratio
export function Logo({ height = 40, style = {} }) {
  return (
    <img
      src="/logo.jpg"
      alt="Dairi Products"
      style={{ height, width: "auto", display: "block", objectFit: "contain", ...style }}
    />
  );
}

// ── Splash Screen ─────────────────────────────────────────────────────────────
function SplashScreen({ onEnter }) {
  return (
    <div
      onClick={onEnter}
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "40px 24px",
      }}
    >
      <div className="splash-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        {/* Big logo */}
        <Logo height={275} />

        {/* Tag line */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 10 }}>
            Underwriting Analytics Platform
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 360, lineHeight: 1.65 }}>
            Deterministic rules engine · Fully explainable recommendations · Evidence-traced findings
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onEnter(); }}
          style={{
            marginTop: 8,
            background: "#1d4ed8", color: "#fff",
            border: "none", borderRadius: 10,
            padding: "14px 40px", fontSize: 15, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.01em",
            boxShadow: "0 4px 18px rgba(29,78,216,0.25)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Get Started →
        </button>

        <div style={{ fontSize: 12, color: "#d1d5db", marginTop: -8 }}>
          or click anywhere to continue
        </div>
      </div>
    </div>
  );
}

// ── Variant Picker ────────────────────────────────────────────────────────────
const VARIANTS = [
  {
    id: "tour",
    label: "Option A",
    name: "Tour-First Dashboard",
    desc: "Full-width tabs with an auto-starting guided tour and a contextual coach strip below each tab. Best for first-time users.",
    accent: "#7c3aed",
    accentBg: "#f5f3ff",
    accentBorder: "#ddd6fe",
  },
  {
    id: "wizard",
    label: "Option B",
    name: "Wizard Flow",
    desc: "Five-step progress stepper with a right-side coach panel. Back/Next navigation unlocks as each step completes.",
    accent: "#0891b2",
    accentBg: "#ecfeff",
    accentBorder: "#a5f3fc",
  },
  {
    id: "workbench",
    label: "Option C",
    name: "Analyst Workbench",
    desc: "Left-nav six-section workbench with a 7-step guided tour, HelpTip explainers, glossary panel, and narrative builder.",
    accent: "#1d4ed8",
    accentBg: "#eff6ff",
    accentBorder: "#bfdbfe",
  },
];

function VariantPicker({ onPick }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 24px 60px",
    }}>
      {/* Header row: logo left, title centred */}
      <div style={{ width: "100%", maxWidth: 980, display: "flex", alignItems: "center", marginBottom: 48, gap: 20 }}>
        <Logo height={72} />
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.3px" }}>
            Choose a Demo Variant
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
            All three connect to the same API and share the same data model.
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center", maxWidth: 980, width: "100%" }}>
        {VARIANTS.map((v) => {
          const isHov = hovered === v.id;
          return (
            <div
              key={v.id}
              onMouseEnter={() => setHovered(v.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onPick(v.id)}
              style={{
                background: isHov ? v.accentBg : "#fff",
                border: `1.5px solid ${isHov ? v.accent + "66" : v.accentBorder}`,
                borderRadius: 16, padding: "28px 26px",
                width: 290, display: "flex", flexDirection: "column", gap: 16,
                boxShadow: isHov ? `0 6px 28px ${v.accent}22` : "0 2px 10px rgba(0,0,0,0.06)",
                transition: "all 0.18s ease",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: v.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                  {v.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{v.name}</div>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "#6b7280", lineHeight: 1.7, flex: 1 }}>{v.desc}</p>
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: isHov ? v.accent : "#f3f4f6",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                transition: "background 0.18s",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isHov ? "#fff" : "#6b7280" }}>
                  Launch variant
                </span>
                <span style={{ fontSize: 16, color: isHov ? "#fff" : "#9ca3af" }}>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
function App() {
  // Splash always shows on every page load. After clicking through, saved
  // variant (if any) is restored; otherwise the picker is shown.
  const [screen, setScreen] = useState("splash");

  const enterPicker = () => {
    setScreen("picker");
  };

  const pickVariant = (id) => {
    localStorage.setItem(LS_KEY, id);
    setScreen(id);
  };

  const reset = () => {
    localStorage.removeItem(LS_KEY);
    setScreen("picker");
  };

  const switcher = (
    <button
      onClick={reset}
      style={{
        background: "#f3f4f6", color: "#374151",
        border: "1px solid #e5e7eb", borderRadius: 7,
        padding: "5px 12px", fontSize: 12, fontWeight: 600,
        cursor: "pointer",
      }}
    >
      ⇄ Switch
    </button>
  );

  if (screen === "splash")    return <SplashScreen  onEnter={enterPicker} />;
  if (screen === "picker")    return <VariantPicker onPick={pickVariant} />;
  if (screen === "tour")      return <TourDashboardApp switcher={switcher} />;
  if (screen === "wizard")    return <WizardApp        switcher={switcher} />;
  return                             <WorkbenchApp     switcher={switcher} />;
}

createRoot(document.getElementById("root")).render(<App />);

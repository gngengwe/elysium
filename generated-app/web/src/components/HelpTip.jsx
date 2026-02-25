import React, { useState } from "react";

/**
 * HelpTip — "?" icon that shows an explainer bubble on hover/click.
 *
 * tip shape: { title, what, why, next }
 */
export function HelpTip({ tip }) {
  const [visible, setVisible] = useState(false);
  if (!tip) return null;

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}
    >
      {/* The ? badge */}
      <span
        role="button"
        tabIndex={0}
        aria-label={`Help: ${tip.title}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => { e.stopPropagation(); setVisible((v) => !v); }}
        onKeyDown={(e) => e.key === "Enter" && setVisible((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 17, height: 17, borderRadius: "50%",
          background: "#e0e7ff", color: "#3730a3",
          fontSize: 10, fontWeight: 800,
          cursor: "pointer", marginLeft: 5, flexShrink: 0, userSelect: "none",
          border: "1.5px solid #c7d2fe",
          lineHeight: 1,
        }}
      >
        ?
      </span>

      {/* Bubble */}
      {visible && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 7px)",
            left: 0,
            zIndex: 9999,
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: 10,
            padding: "12px 14px",
            width: 268,
            boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
            fontSize: 12.5,
            lineHeight: 1.55,
            pointerEvents: "none",
          }}
        >
          {/* Arrow */}
          <div style={{
            position: "absolute", top: -5, left: 10,
            width: 10, height: 10,
            background: "#1e293b",
            transform: "rotate(45deg)",
            borderRadius: 2,
          }} />

          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: "#bfdbfe" }}>
            {tip.title}
          </div>
          <Row label="What" text={tip.what} />
          <Row label="Why"  text={tip.why}  />
          <Row label="Next" text={tip.next} />
        </div>
      )}
    </span>
  );
}

function Row({ label, text }) {
  return (
    <div style={{ marginBottom: 5, display: "flex", gap: 5 }}>
      <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ color: "#e2e8f0" }}>{text}</span>
    </div>
  );
}

import React from "react";
import Joyride, { STATUS } from "react-joyride";

const STEPS = [
  {
    target: '[data-tour="load-demo-client"]',
    title: "1 · Load the Demo Client",
    content:
      "Click this button to load the seeded demo borrower. It calls GET /demo/client and pre-populates every section with real extracted data.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="client-profile"]',
    title: "2 · Client Profile Context",
    content:
      "The client card shows qualitative context: name, bio, and goals. Underwriters use this to frame the meaning of every quantitative signal below.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="nav-documents"]',
    title: "3 · Source Documents",
    content:
      "Every recommendation traces back to an ingested document. This section shows which filings are on file (K-1s, 1040s) and their tax years.",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-fields"]',
    title: "4 · Extracted Fields",
    content:
      "Structured fields extracted from each document. Each has a canonical key like k1.distributions that the rules engine reads deterministically.",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="generate-recommendations"]',
    title: "5 · Generate Recommendations",
    content:
      "Runs all three rules: K-1 net income, depreciation add-back, and recurring distribution heuristic. Each output is scored 0–100 and ranked.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="open-evidence"]',
    title: "6 · Open the Evidence Drawer",
    content:
      "Click any recommendation card to open the Evidence Drawer. It shows the exact field values and arithmetic that produced this insight.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="export-package"]',
    title: "7 · Export Package",
    content:
      "Generate a portable JSON bundle: client profile + all ranked recommendations + evidence traces. Click 'Copy' to hand off to downstream systems.",
    disableBeacon: true,
    placement: "right",
  },
];

export function Tour({ run, onFinish, onStepChange }) {
  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      floaterProps={{ disableAnimation: false }}
      styles={{
        options: {
          primaryColor: "#1d4ed8",
          backgroundColor: "#fff",
          textColor: "#111827",
          arrowColor: "#fff",
          overlayColor: "rgba(0,0,0,0.38)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          boxShadow: "0 8px 36px rgba(0,0,0,0.18)",
          padding: "18px 22px",
          maxWidth: 340,
        },
        tooltipTitle: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#111827" },
        tooltipContent: { fontSize: 13.5, lineHeight: 1.6, color: "#374151" },
        buttonNext: { borderRadius: 7, fontSize: 13, fontWeight: 600, padding: "7px 16px" },
        buttonBack: { borderRadius: 7, fontSize: 13, color: "#6b7280" },
        buttonSkip: { fontSize: 12, color: "#9ca3af" },
        beacon: { display: "none" },
      }}
      callback={({ index, type, status }) => {
        if (type === "step:before" && onStepChange) {
          onStepChange(index);
        }
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
          onFinish();
        }
      }}
    />
  );
}

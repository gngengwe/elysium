export const GLOSSARY = [
  {
    term: "Client",
    definition: "The borrower or entity being evaluated for credit or underwriting approval.",
    tip: {
      title: "Client Profile",
      what: "The borrower entity — name, bio, and stated goals.",
      why: "Qualitative context shapes how quantitative signals are interpreted.",
      next: "Load a demo client then review the Profile section.",
    },
  },
  {
    term: "Document",
    definition: "A source financial filing ingested into the system (K-1, 1040, W-2, etc.).",
    tip: {
      title: "Source Documents",
      what: "Raw financial filings attached to the client record.",
      why: "Every recommendation must trace back to a specific source document for auditability.",
      next: "Check the Documents tab to see what has been ingested.",
    },
  },
  {
    term: "doc_type",
    definition: "A label classifying the document kind: K1, 1040, W2, etc.",
    tip: {
      title: "Document Type (doc_type)",
      what: "A short code categorising the document class.",
      why: "The rules engine uses doc_type to apply the correct parsing and logic path.",
      next: "K1 and 1040 types activate the most rules in this demo.",
    },
  },
  {
    term: "Extracted Fields",
    definition: "Structured key-value pairs normalised from a raw document payload.",
    tip: {
      title: "Extracted Fields",
      what: "Normalised key-value data pulled from document payloads.",
      why: "Rules operate on extracted fields, not raw documents — normalisation is critical.",
      next: "Visit the Fields tab to inspect what was extracted from each document.",
    },
  },
  {
    term: "Field Key",
    definition: "A canonical dot-notation identifier for a data point (e.g. k1.distributions).",
    tip: {
      title: "Field Key",
      what: "A stable, canonical name for each extracted data point.",
      why: "Field keys let rules reference data consistently across document types and years.",
      next: "Check the Fields table for keys like k1.distributions or tax.depreciation.",
    },
  },
  {
    term: "Rules Engine",
    definition: "A deterministic system applying pre-defined financial logic to extracted fields.",
    tip: {
      title: "Rules Engine vs ML",
      what: "A set of explicit, auditable rules that fire based on available fields.",
      why: "Unlike ML, every output traces to a specific formula — no black-box decisions.",
      next: "Click Generate Recommendations to run all rules against the loaded client.",
    },
  },
  {
    term: "Recommendation",
    definition: "One rule's output: a scored, explained finding including evidence and calculations.",
    tip: {
      title: "Recommendation",
      what: "A single rule's output — scored, titled, and paired with evidence.",
      why: "Each recommendation is independently auditable and maps to one financial signal.",
      next: "Open the Recommendations tab and click a card to see its evidence drawer.",
    },
  },
  {
    term: "Score",
    definition: "A 0–100 numeric signal indicating how significant or favourable a finding is.",
    tip: {
      title: "Score & Ranking",
      what: "A 0-100 numeric signal produced by each rule's scoring formula.",
      why: "Scores rank recommendations so the most material signals appear first.",
      next: "Green ≥70 · Yellow ≥50 · Red below 50. Check the ranked list.",
    },
  },
  {
    term: "Evidence",
    definition: "The exact field values (year, key, value) that caused a rule to fire.",
    tip: {
      title: "Evidence Trace",
      what: "The exact field values the rule read to produce its output.",
      why: "Evidence makes recommendations auditable — every insight traces to raw data.",
      next: "Click a recommendation card to open the Evidence Drawer.",
    },
  },
  {
    term: "Calculation Trace",
    definition: "The step-by-step arithmetic applied to evidence values to derive the insight.",
    tip: {
      title: "Calculation Trace",
      what: "The arithmetic the rule applied to produce the recommendation insight.",
      why: "Calculation traces let underwriters verify the maths behind every finding.",
      next: "Find it in the Evidence Drawer under 'Calculations'.",
    },
  },
  {
    term: "Export Package",
    definition: "A structured JSON bundle: client profile + all ranked recommendations + evidence.",
    tip: {
      title: "Export Package",
      what: "A portable JSON bundle of the full client analysis.",
      why: "Export packages are the handoff artifact — used by downstream systems or loan officers.",
      next: "Go to the Export tab to generate and copy the full package.",
    },
  },
  {
    term: "Audit Trail",
    definition: "A timestamped log of all system events: ingestion, generation, and export actions.",
    tip: {
      title: "Audit Trail",
      what: "A time-ordered log of every action taken on this client's record.",
      why: "Required for compliance — every recommendation must be traceable to a trigger event.",
      next: "The Audit tab is a stub in this demo; production would log all DB writes.",
    },
  },
];

// Keyed lookup by term name for easy access in tips
export const TIPS = Object.fromEntries(GLOSSARY.map((g) => [g.term, g.tip]));

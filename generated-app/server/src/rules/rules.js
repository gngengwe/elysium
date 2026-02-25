// Simple, deterministic demo rules.
// Each rule returns: { rule_id, title, insight, score, calculations, evidence }

export function k1NetIncomeRule({ k1ByYear }) {
  const years = Object.keys(k1ByYear).map((y) => Number(y)).sort((a, b) => a - b);
  if (!years.length) return null;

  const latest = years[years.length - 1];
  const latestK1 = k1ByYear[latest];
  const dist = latestK1.distributions ?? 0;
  const contrib = latestK1.contributions ?? 0;
  const net = dist - contrib;

  if (net <= 0) return null;

  return {
    rule_id: "RULE-K1-NET-INCOME",
    title: "K-1 net attributable income (distributions minus contributions)",
    insight:
      `Latest-year K-1 distributions of $${dist.toLocaleString()} minus contributions of $${contrib.toLocaleString()} yields net attributable income of $${net.toLocaleString()}.`,
    score: Math.min(100, 40 + net / 5000),
    calculations: { year: latest, distributions: dist, contributions: contrib, net_income: net },
    evidence: [
      { year: latest, field: "k1.distributions", value: dist },
      { year: latest, field: "k1.contributions", value: contrib },
    ],
  };
}

export function depreciationAddBackRule({ taxFields }) {
  const dep = taxFields.depreciation ?? 0;
  const netIncome = taxFields.net_income ?? null;
  if (!dep || dep <= 0) return null;

  const adjusted = netIncome != null ? Number(netIncome) + Number(dep) : null;

  return {
    rule_id: "RULE-DEPR-ADD-BACK",
    title: "Depreciation add-back adjustment",
    insight:
      adjusted != null
        ? `Depreciation of $${Number(dep).toLocaleString()} is a non-cash expense; adding back to net income $${Number(netIncome).toLocaleString()} yields adjusted income $${Number(adjusted).toLocaleString()}.`
        : `Depreciation of $${Number(dep).toLocaleString()} is a non-cash expense and is flagged for add-back consideration.`,
    score: Math.min(100, 30 + Number(dep) / 1000),
    calculations: { year: taxFields.year, depreciation: dep, net_income: netIncome, adjusted_income: adjusted },
    evidence: [
      { year: taxFields.year, field: "tax.depreciation", value: dep },
      ...(netIncome != null ? [{ year: taxFields.year, field: "tax.net_income", value: netIncome }] : []),
    ],
  };
}

export function recurringDistributionHeuristic({ k1ByYear }) {
  const years = Object.keys(k1ByYear).map((y) => Number(y)).sort((a, b) => a - b);
  if (years.length < 2) return null;

  const y1 = years[years.length - 2];
  const y2 = years[years.length - 1];
  const d1 = k1ByYear[y1].distributions ?? 0;
  const d2 = k1ByYear[y2].distributions ?? 0;

  if (d1 <= 0 || d2 <= 0) return null;

  const ratio = d2 / d1;
  const stable = ratio >= 0.75 && ratio <= 1.35;

  return {
    rule_id: "RULE-RECURRING-DIST",
    title: "Recurring distribution pattern (2-year heuristic)",
    insight: stable
      ? `K-1 distributions appear recurring: $${d1.toLocaleString()} in ${y1} and $${d2.toLocaleString()} in ${y2} (ratio ${ratio.toFixed(2)}).`
      : `K-1 distributions vary year-over-year: $${d1.toLocaleString()} in ${y1} and $${d2.toLocaleString()} in ${y2} (ratio ${ratio.toFixed(2)}). Consider stability factors.`,
    score: stable ? 65 : 35,
    calculations: { year_1: y1, year_2: y2, dist_1: d1, dist_2: d2, ratio, stable },
    evidence: [
      { year: y1, field: "k1.distributions", value: d1 },
      { year: y2, field: "k1.distributions", value: d2 },
    ],
  };
}

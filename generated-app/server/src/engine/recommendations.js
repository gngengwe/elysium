import { pool } from "../db.js";
import { k1NetIncomeRule, depreciationAddBackRule, recurringDistributionHeuristic } from "../rules/rules.js";

async function loadFieldsForClient(clientId) {
  const docs = await pool.query(
    "select id, doc_type, tax_year from documents where client_id=$1",
    [clientId]
  );
  const docIds = docs.rows.map((d) => d.id);
  if (!docIds.length) return { documents: [], fields: [] };

  const fields = await pool.query(
    "select document_id, field_key, value_num, value_text from extracted_fields where document_id = any($1::uuid[])",
    [docIds]
  );

  return { documents: docs.rows, fields: fields.rows };
}

export async function generateRecommendations({ clientId }) {
  // Clear prior recs to make demo repeatable
  await pool.query("delete from recommendations where client_id=$1", [clientId]);

  const { documents, fields } = await loadFieldsForClient(clientId);

  // Build structured input for rules
  const k1ByYear = {};
  const taxFields = { year: null };

  for (const doc of documents) {
    const docFields = fields.filter((f) => f.document_id === doc.id);

    if (doc.doc_type === "K1" && doc.tax_year) {
      const obj = k1ByYear[doc.tax_year] || {};
      for (const f of docFields) {
        if (f.field_key === "k1.distributions") obj.distributions = Number(f.value_num || 0);
        if (f.field_key === "k1.contributions") obj.contributions = Number(f.value_num || 0);
      }
      k1ByYear[doc.tax_year] = obj;
    }

    if (doc.doc_type === "1040" && doc.tax_year) {
      taxFields.year = doc.tax_year;
      for (const f of docFields) {
        if (f.field_key === "tax.depreciation") taxFields.depreciation = Number(f.value_num || 0);
        if (f.field_key === "tax.net_income") taxFields.net_income = Number(f.value_num || 0);
      }
    }
  }

  const candidates = [
    k1NetIncomeRule({ k1ByYear }),
    depreciationAddBackRule({ taxFields }),
    recurringDistributionHeuristic({ k1ByYear }),
  ].filter(Boolean);

  // Sort by score descending
  candidates.sort((a, b) => Number(b.score) - Number(a.score));

  // Persist to DB
  for (const rec of candidates) {
    await pool.query(
      "insert into recommendations(client_id, rule_id, title, insight, score, calculations_json, evidence_json) values($1,$2,$3,$4,$5,$6,$7)",
      [clientId, rec.rule_id, rec.title, rec.insight, rec.score, rec.calculations, rec.evidence]
    );
  }

  return { client_id: clientId, generated: candidates.length, recommendations: candidates };
}

import express from "express";
import cors from "cors";
import { pool, initDb } from "./db.js";
import { generateRecommendations } from "./engine/recommendations.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.SERVER_PORT || 8080;

app.get("/health", (_req, res) => res.json({ ok: true }));

// Returns the seeded demo client
app.get("/demo/client", async (_req, res) => {
  const { rows } = await pool.query("select * from clients order by created_at asc limit 1");
  if (!rows.length) return res.status(404).json({ error: "No demo client found (seed failed)." });
  res.json(rows[0]);
});

app.post("/clients", async (req, res) => {
  const { name, bio, goals_json } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const { rows } = await pool.query(
    "insert into clients(name, bio, goals_json) values($1,$2,$3) returning *",
    [name, bio || "", goals_json || {}]
  );
  res.status(201).json(rows[0]);
});

// Demo ingestion: store a document and optional extracted_fields
app.post("/documents", async (req, res) => {
  const { client_id, doc_type, tax_year, payload_json, extracted_fields } = req.body || {};
  if (!client_id || !doc_type) return res.status(400).json({ error: "client_id and doc_type required" });

  const docIns = await pool.query(
    "insert into documents(client_id, doc_type, tax_year, payload_json) values($1,$2,$3,$4) returning *",
    [client_id, doc_type, tax_year || null, payload_json || {}]
  );
  const doc = docIns.rows[0];

  if (Array.isArray(extracted_fields) && extracted_fields.length) {
    const values = [];
    const params = [];
    let i = 1;
    for (const f of extracted_fields) {
      params.push(`($${i++},$${i++},$${i++},$${i++},$${i++})`);
      values.push(doc.id, f.field_key, f.field_label || "", f.value_num ?? null, f.value_text ?? null);
    }
    await pool.query(
      `insert into extracted_fields(document_id, field_key, field_label, value_num, value_text) values ${params.join(",")}`,
      values
    );
  }

  res.status(201).json({ document: doc });
});

// Generate and persist recommendations
app.post("/recommendations/generate", async (req, res) => {
  const clientId = req.query.client_id;
  if (!clientId) return res.status(400).json({ error: "client_id query param required" });
  const result = await generateRecommendations({ clientId });
  res.json(result);
});

app.get("/recommendations", async (req, res) => {
  const clientId = req.query.client_id;
  if (!clientId) return res.status(400).json({ error: "client_id query param required" });
  const { rows } = await pool.query(
    "select * from recommendations where client_id=$1 order by score desc, created_at desc",
    [clientId]
  );
  res.json({ recommendations: rows });
});

// GET /documents?client_id=  — list source documents
app.get("/documents", async (req, res) => {
  const clientId = req.query.client_id;
  if (!clientId) return res.status(400).json({ error: "client_id query param required" });
  const { rows } = await pool.query(
    "select * from documents where client_id=$1 order by tax_year asc, created_at asc",
    [clientId]
  );
  res.json({ documents: rows });
});

// GET /fields?client_id=  — list extracted fields with doc metadata
app.get("/fields", async (req, res) => {
  const clientId = req.query.client_id;
  if (!clientId) return res.status(400).json({ error: "client_id query param required" });
  const { rows } = await pool.query(
    `select ef.id, ef.field_key, ef.field_label, ef.value_num, ef.value_text,
            ef.created_at, d.doc_type, d.tax_year
     from extracted_fields ef
     join documents d on d.id = ef.document_id
     where d.client_id = $1
     order by d.tax_year asc, ef.field_key asc`,
    [clientId]
  );
  res.json({ fields: rows });
});

app.get("/export/package", async (req, res) => {
  const clientId = req.query.client_id;
  if (!clientId) return res.status(400).json({ error: "client_id query param required" });

  const client = (await pool.query("select * from clients where id=$1", [clientId])).rows[0];
  const recs = (await pool.query(
    "select * from recommendations where client_id=$1 order by score desc, created_at desc",
    [clientId]
  )).rows;

  const pkg = {
    export_type: "contextual_underwriting_export_package",
    generated_at: new Date().toISOString(),
    client: client || null,
    recommendations: recs,
  };

  await pool.query(
    "insert into export_packages(client_id, package_json) values($1,$2)",
    [clientId, pkg]
  );

  res.json(pkg);
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ API listening on :${PORT}`));
  })
  .catch((e) => {
    console.error("DB init failed:", e);
    process.exit(1);
  });

import path from "path";
import fs from "fs";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(fp, content) {
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, content, "utf8");
}

function writeJSON(fp, obj) {
  writeFile(fp, JSON.stringify(obj, null, 2));
}

export async function generateDemoApp(outDir) {
  ensureDir(outDir);

  // Root
  writeFile(path.join(outDir, "README.md"), README);
  writeFile(path.join(outDir, ".env.example"), ENV_EXAMPLE);
  writeFile(path.join(outDir, "docker-compose.yml"), DOCKER_COMPOSE);
  writeJSON(path.join(outDir, "package.json"), ROOT_PACKAGE_JSON);

  // Backend
  writeJSON(path.join(outDir, "server/package.json"), SERVER_PACKAGE_JSON);
  writeFile(path.join(outDir, "server/Dockerfile"), SERVER_DOCKERFILE);
  writeFile(path.join(outDir, "server/src/index.js"), SERVER_INDEX_JS);
  writeFile(path.join(outDir, "server/src/db.js"), SERVER_DB_JS);
  writeFile(path.join(outDir, "server/src/schema.sql"), SERVER_SCHEMA_SQL);
  writeFile(path.join(outDir, "server/src/seed.sql"), SERVER_SEED_SQL);
  writeFile(path.join(outDir, "server/src/rules/rules.js"), RULES_JS);
  writeFile(path.join(outDir, "server/src/engine/recommendations.js"), RECOMMENDATIONS_ENGINE_JS);

  // Frontend
  writeJSON(path.join(outDir, "web/package.json"), WEB_PACKAGE_JSON);
  writeFile(path.join(outDir, "web/Dockerfile"), WEB_DOCKERFILE);
  writeFile(path.join(outDir, "web/vite.config.js"), VITE_CONFIG_JS);
  writeFile(path.join(outDir, "web/index.html"), WEB_INDEX_HTML);
  writeFile(path.join(outDir, "web/src/main.jsx"), WEB_MAIN_JSX);
  writeFile(path.join(outDir, "web/src/api.js"), WEB_API_JS);
}

// ==================== FILE CONTENTS ====================

const README = `# Underwriting Analytics Demo (Always Runnable)

This repo is a demo-ready MVP of a "Contextual Underwriting Analytics" system.

## What it demonstrates
- Client profiles
- Demo document ingestion (JSON)
- Stored extracted fields (K-1, tax return)
- Working rules engine that generates explainable recommendations:
  - K-1 Net Income: distributions - contributions
  - Depreciation add-back
  - Simple recurring distribution heuristic (2-year check)
- Ranked recommendations
- Export package endpoint
- Minimal UI to trigger recommendation generation and display results

## Quick start (Docker)
1) Copy env:
\`\`\`bash
cp .env.example .env
\`\`\`

2) Start:
\`\`\`bash
docker compose up -d --build
\`\`\`

3) Open:
- UI: http://localhost:5173
- API: http://localhost:8080

## API endpoints
- GET /health
- GET /demo/client
- POST /clients
- POST /documents
- POST /recommendations/generate?client_id=...
- GET /recommendations?client_id=...
- GET /export/package?client_id=...

## Demo flow in UI
- "Load Demo Client"
- "Generate Recommendations"
- View ranked recommendations + evidence
`;

const ENV_EXAMPLE = `# Postgres
POSTGRES_USER=demo
POSTGRES_PASSWORD=demo
POSTGRES_DB=underwriting_demo
POSTGRES_PORT=5432

# Server
SERVER_PORT=8080
DATABASE_URL=postgres://demo:demo@db:5432/underwriting_demo

# Web
VITE_API_BASE=http://localhost:8080
`;

const DOCKER_COMPOSE = `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
    ports:
      - "\${POSTGRES_PORT}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  server:
    build: ./server
    environment:
      SERVER_PORT: \${SERVER_PORT}
      DATABASE_URL: \${DATABASE_URL}
    depends_on:
      - db
    ports:
      - "\${SERVER_PORT}:8080"

  web:
    build: ./web
    environment:
      - VITE_API_BASE=\${VITE_API_BASE}
    depends_on:
      - server
    ports:
      - "5173:5173"

volumes:
  pgdata:
`;

const ROOT_PACKAGE_JSON = {
  name: "underwriting-demo-root",
  private: true,
  type: "module",
  scripts: {
    "dev:server": "npm --prefix server run dev",
    "dev:web": "npm --prefix web run dev",
  },
};

// -------------------- SERVER --------------------

const SERVER_PACKAGE_JSON = {
  name: "underwriting-demo-server",
  private: true,
  type: "module",
  scripts: {
    dev: "node src/index.js",
  },
  dependencies: {
    express: "^4.19.2",
    cors: "^2.8.5",
    pg: "^8.12.0",
  },
};

const SERVER_DOCKERFILE = `FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
EXPOSE 8080
CMD ["npm","run","dev"]
`;

const SERVER_INDEX_JS = `import express from "express";
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
      params.push(\`($\${i++},$\${i++},$\${i++},$\${i++},$\${i++})\`);
      values.push(doc.id, f.field_key, f.field_label || "", f.value_num ?? null, f.value_text ?? null);
    }
    await pool.query(
      \`insert into extracted_fields(document_id, field_key, field_label, value_num, value_text) values \${params.join(",")}\`,
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
    app.listen(PORT, () => console.log(\`✅ API listening on :\${PORT}\`));
  })
  .catch((e) => {
    console.error("DB init failed:", e);
    process.exit(1);
  });
`;

const SERVER_DB_JS = `import pg from "pg";
import { readFile } from "node:fs/promises";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  // Wait for DB to be ready (up to 10 seconds)
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      await pool.query("select 1");
      break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500));
      if (attempt === 20) throw e;
    }
  }

  const schemaSql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  const seedSql = await readFile(new URL("./seed.sql", import.meta.url), "utf8");

  await pool.query(schemaSql);
  await pool.query(seedSql);
}
`;

const SERVER_SCHEMA_SQL = `-- Idempotent schema
create extension if not exists pgcrypto;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text not null default '',
  goals_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  doc_type text not null,
  tax_year int,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists extracted_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  field_key text not null,
  field_label text not null default '',
  value_num numeric,
  value_text text,
  created_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  rule_id text not null,
  title text not null,
  insight text not null,
  score numeric not null,
  calculations_json jsonb not null default '{}'::jsonb,
  evidence_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists export_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  package_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_client on documents(client_id);
create index if not exists idx_recs_client on recommendations(client_id);
`;

const SERVER_SEED_SQL = `-- Seed once (if no clients)
do $$
begin
  if not exists (select 1 from clients) then
    insert into clients(name, bio, goals_json)
    values (
      'Demo Borrower LLC',
      'Owner-operated services business. Borrower seeks loan approval for expansion; emphasizes stable recurring cash flow.',
      '{"loan_purpose":"expansion","risk_appetite":"moderate","priority":"recurring_income"}'::jsonb
    );
  end if;
end $$;

-- Seed demo documents + extracted fields (if no documents)
do $$
declare
  c uuid;
  doc_k1_2022 uuid;
  doc_k1_2023 uuid;
  doc_1040_2023 uuid;
begin
  select id into c from clients order by created_at asc limit 1;

  if not exists (select 1 from documents where client_id=c) then
    insert into documents(client_id, doc_type, tax_year, payload_json)
      values (c, 'K1', 2022, '{"entity":"S-Corp A"}'::jsonb)
      returning id into doc_k1_2022;

    insert into extracted_fields(document_id, field_key, field_label, value_num)
      values
        (doc_k1_2022, 'k1.distributions', 'K-1 Distributions', 160000),
        (doc_k1_2022, 'k1.contributions', 'K-1 Contributions', 30000);

    insert into documents(client_id, doc_type, tax_year, payload_json)
      values (c, 'K1', 2023, '{"entity":"S-Corp A"}'::jsonb)
      returning id into doc_k1_2023;

    insert into extracted_fields(document_id, field_key, field_label, value_num)
      values
        (doc_k1_2023, 'k1.distributions', 'K-1 Distributions', 185000),
        (doc_k1_2023, 'k1.contributions', 'K-1 Contributions', 40000);

    insert into documents(client_id, doc_type, tax_year, payload_json)
      values (c, '1040', 2023, '{"form":"1040"}'::jsonb)
      returning id into doc_1040_2023;

    insert into extracted_fields(document_id, field_key, field_label, value_num)
      values
        (doc_1040_2023, 'tax.depreciation', 'Depreciation', 22000),
        (doc_1040_2023, 'tax.net_income', 'Net Income', 98000);
  end if;
end $$;
`;

const RULES_JS = `// Simple, deterministic demo rules.
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
      \`Latest-year K-1 distributions of $\${dist.toLocaleString()} minus contributions of $\${contrib.toLocaleString()} yields net attributable income of $\${net.toLocaleString()}.\`,
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
        ? \`Depreciation of $\${Number(dep).toLocaleString()} is a non-cash expense; adding back to net income $\${Number(netIncome).toLocaleString()} yields adjusted income $\${Number(adjusted).toLocaleString()}.\`
        : \`Depreciation of $\${Number(dep).toLocaleString()} is a non-cash expense and is flagged for add-back consideration.\`,
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
      ? \`K-1 distributions appear recurring: $\${d1.toLocaleString()} in \${y1} and $\${d2.toLocaleString()} in \${y2} (ratio \${ratio.toFixed(2)}).\`
      : \`K-1 distributions vary year-over-year: $\${d1.toLocaleString()} in \${y1} and $\${d2.toLocaleString()} in \${y2} (ratio \${ratio.toFixed(2)}). Consider stability factors.\`,
    score: stable ? 65 : 35,
    calculations: { year_1: y1, year_2: y2, dist_1: d1, dist_2: d2, ratio, stable },
    evidence: [
      { year: y1, field: "k1.distributions", value: d1 },
      { year: y2, field: "k1.distributions", value: d2 },
    ],
  };
}
`;

const RECOMMENDATIONS_ENGINE_JS = `import { pool } from "../db.js";
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
`;

// -------------------- WEB --------------------

const WEB_PACKAGE_JSON = {
  name: "underwriting-demo-web",
  private: true,
  type: "module",
  scripts: {
    dev: "vite --host 0.0.0.0 --port 5173",
    build: "vite build",
    preview: "vite preview --host 0.0.0.0 --port 5173",
  },
  dependencies: {
    react: "^18.3.1",
    "react-dom": "^18.3.1",
  },
  devDependencies: {
    vite: "^5.4.0",
    "@vitejs/plugin-react": "^4.3.1",
  },
};

const WEB_DOCKERFILE = `FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm","run","dev"]
`;

const VITE_CONFIG_JS = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;

const WEB_INDEX_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Underwriting Analytics Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

const WEB_API_JS = `const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export async function getDemoClient() {
  const r = await fetch(\`\${API_BASE}/demo/client\`);
  if (!r.ok) throw new Error("Failed to load demo client");
  return r.json();
}

export async function generateRecommendations(clientId) {
  const r = await fetch(\`\${API_BASE}/recommendations/generate?client_id=\${clientId}\`, { method: "POST" });
  if (!r.ok) throw new Error("Failed to generate recommendations");
  return r.json();
}

export async function listRecommendations(clientId) {
  const r = await fetch(\`\${API_BASE}/recommendations?client_id=\${clientId}\`);
  if (!r.ok) throw new Error("Failed to list recommendations");
  return r.json();
}
`;

const WEB_MAIN_JSX = `import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { getDemoClient, generateRecommendations, listRecommendations } from "./api.js";

const SCORE_COLOR = (score) => {
  if (score >= 70) return "#16a34a";
  if (score >= 50) return "#ca8a04";
  return "#dc2626";
};

function ScoreBadge({ score }) {
  return (
    <span style={{
      background: SCORE_COLOR(score),
      color: "#fff",
      borderRadius: 6,
      padding: "2px 10px",
      fontWeight: 700,
      fontSize: 15,
      minWidth: 52,
      display: "inline-block",
      textAlign: "center",
    }}>
      {Number(score).toFixed(1)}
    </span>
  );
}

function App() {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState("");
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadClient = async () => {
    setLoading(true);
    setStatus("Loading demo client...");
    try {
      const c = await getDemoClient();
      setClient(c);
      setStatus("Demo client loaded.");
    } catch (e) {
      setStatus("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const runGenerate = async () => {
    if (!client?.id) return;
    setLoading(true);
    setStatus("Generating recommendations...");
    try {
      await generateRecommendations(client.id);
      const list = await listRecommendations(client.id);
      setRecs(list.recommendations || []);
      setStatus(\`Done. \${list.recommendations?.length || 0} recommendation(s) generated.\`);
    } catch (e) {
      setStatus("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px 32px", maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4 }}>Underwriting Analytics Demo</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Seeded client · Extracted K-1 &amp; 1040 fields · Rules engine · Ranked recommendations
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={loadClient}
          disabled={loading}
          style={{ padding: "8px 18px", cursor: "pointer", borderRadius: 6, border: "1px solid #aaa" }}
        >
          Load Demo Client
        </button>
        <button
          onClick={runGenerate}
          disabled={!client || loading}
          style={{
            padding: "8px 18px",
            cursor: client && !loading ? "pointer" : "not-allowed",
            borderRadius: 6,
            border: "1px solid #aaa",
            background: client ? "#1d4ed8" : "#e5e7eb",
            color: client ? "#fff" : "#999",
          }}
        >
          Generate Recommendations
        </button>
      </div>

      {status && (
        <div style={{ marginBottom: 16, color: loading ? "#2563eb" : "#374151", fontSize: 14 }}>{status}</div>
      )}

      {client && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", marginBottom: 24, background: "#f9fafb" }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{client.name}</div>
          <div style={{ color: "#555", marginTop: 4 }}>{client.bio}</div>
        </div>
      )}

      {recs.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Ranked Recommendations</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {recs.map((r, i) => (
              <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>#{i + 1} · {r.rule_id}</span>
                    <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>{r.title}</div>
                  </div>
                  <ScoreBadge score={r.score} />
                </div>
                <div style={{ marginTop: 8, color: "#374151" }}>{r.insight}</div>
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", color: "#6b7280", fontSize: 13 }}>Evidence &amp; Calculations</summary>
                  <pre style={{ whiteSpace: "pre-wrap", background: "#f3f4f6", padding: 10, borderRadius: 6, fontSize: 12, marginTop: 6 }}>
{JSON.stringify({ evidence: r.evidence_json, calculations: r.calculations_json }, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
`;

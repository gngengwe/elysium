# Underwriting Analytics Demo

A demo-ready underwriting analytics platform with three interchangeable UI variants, a deterministic rules engine, and fully explainable recommendations.

## What it includes

- **3 UI variants** — pick one at the splash screen:
  - **Option A — Tour-First Dashboard**: Full-width tabs with auto-start guided tour
  - **Option B — Wizard Flow**: 5-step stepper with coach panel
  - **Option C — Analyst Workbench**: Left-nav workbench with glossary and narrative builder
- **Rules engine** — K-1 net income, depreciation add-back, recurring distribution heuristic
- **Evidence drawer** — every recommendation shows the exact data fields and calculations behind it
- **Export package** — portable JSON bundle of the full analysis
- **No database setup needed** — uses PGlite (Postgres 16 running in-process)

---

## Quick start (no Docker required)

You need **Node.js 18+** installed. Then:

```bash
# 1. Clone the repo
git clone https://github.com/gngengwe/elysium.git
cd elysium/generated-app

# 2. Install server dependencies
cd server && npm install && cd ..

# 3. Install web dependencies
cd web && npm install && cd ..

# 4. Start the API server (terminal 1)
cd server && node src/index.js
# → running at http://localhost:8080

# 5. Start the UI (terminal 2)
cd web && npx vite --host 0.0.0.0 --port 5173
# → open http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

---

## Demo flow

1. **Splash screen** — click "Get Started →"
2. **Pick a variant** — choose Option A, B, or C
3. **Load Demo Client** — populates all tabs with sample K-1 / tax return data
4. **Generate Recommendations** — runs the rules engine
5. **Click any recommendation** — opens the evidence drawer with full calculation trace
6. **Export** — downloads a portable JSON analysis package
7. Use the **⇄ Switch** button (top right) to try a different variant

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/demo/client` | Load the pre-seeded demo client |
| GET | `/recommendations?client_id=` | Fetch scored recommendations |
| POST | `/recommendations/generate?client_id=` | Run the rules engine |
| GET | `/fields?client_id=` | Extracted financial fields |
| GET | `/documents?client_id=` | Source document list |
| GET | `/export/package?client_id=` | Full JSON export bundle |

---

## Docker (optional)

If you prefer Docker:

```bash
cp .env.example .env
docker compose up -d --build
```

- UI: http://localhost:5173
- API: http://localhost:8080

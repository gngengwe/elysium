# Underwriting Analytics Demo (Always Runnable)

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
```bash
cp .env.example .env
```

2) Start:
```bash
docker compose up -d --build
```

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

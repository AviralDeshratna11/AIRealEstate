# ASTRA Estate - Mumbai Multi-Agent Real Estate OS

ASTRA Estate is a deployable, Mumbai-first, multi-agent real-estate transaction platform. It replaces rigid portal filters with semantic search, real map navigation, WhatsApp/call assistants, AI-guided tours, finance/material estimators, market intelligence, document due diligence, and LP-powered negotiation.

## What changed in the Mumbai launch build

- **Real Mumbai map layer:** Leaflet + OpenStreetMap with actual Mumbai locality coordinates for Powai, Bandra, Borivali, Andheri, Worli, Ghatkopar, Malad, and Chembur.
- **More automation agents:** 10-agent swarm: Search, WhatsApp, Call, Tour Guide, Finance/Construction, Market Intelligence, Negotiation, Document, Availability, and Codex Ops.
- **Market-aware ranking:** properties are enriched with redevelopment score, months inventory, liquidity/rental/commute metrics, EMI estimate, construction cost, and material ranges.
- **User reference factors included:** construction cost range, material estimates, home-loan EMI logic, Mumbai unsold inventory by price bucket, and redevelopment micro-market intelligence.
- **Codex-to-win layer:** `.codex/skills/property-ingestion-pipeline` automates uploaded deed + media ingestion, marketing copy, mock 3DGS asset generation, and DB update.

## Monorepo

```txt
astra-estate/
├── backend/                  # FastAPI + LangGraph + pgvector-ready API
├── frontend/                 # Next.js + Tailwind + Leaflet map UI
├── .codex/skills/             # Codex Agent Skills for property ingestion
├── docker-compose.yml
└── .env.example
```

## Local quick start

```bash
cp .env.example .env

docker compose up --build
```

Then open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

The app works without paid keys by using in-memory Mumbai demo data and deterministic agent fallbacks.

## Backend manual run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

## Frontend manual run

```bash
cd frontend
npm install
npm run dev
```

## API smoke tests

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/properties
curl http://localhost:8000/api/properties/geojson
curl http://localhost:8000/api/market/mumbai/insights

curl -X POST http://localhost:8000/api/properties/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"2BHK below 2.5 cr in Andheri or Borivali with low inventory", "limit": 5}'

curl -X POST http://localhost:8000/api/finance/estimate \
  -H 'Content-Type: application/json' \
  -d '{"property_id":"mumbai-borivali-1", "down_payment_pct":20, "annual_rate_pct":8, "tenure_years":20}'

curl -X POST http://localhost:8000/api/whatsapp/webhook \
  -H 'Content-Type: application/json' \
  -d '{"From":"+919999999999", "Body":"3BHK Powai under 4 cr, want visit tomorrow"}'

curl -X POST http://localhost:8000/api/tour/guide \
  -H 'Content-Type: application/json' \
  -d '{"property_id":"mumbai-powai-1", "query":"show me living room light and commute"}'
```

## Supabase / pgvector setup

1. Create a free Supabase project.
2. Open SQL editor and run `backend/app/db/schema.sql`.
3. Copy your pooled Postgres URL into `.env` as `DATABASE_URL`.
4. Seed demo Mumbai listings:

```bash
cd backend
python -m app.db.seed
```

## Environment variables

See `.env.example`. Required only for production-grade behavior:

- `OPENAI_API_KEY` for structured outputs, semantic embeddings, and document extraction.
- `DATABASE_URL` for Supabase/Postgres/pgvector.
- `CALCOM_API_KEY`, `CALCOM_EVENT_TYPE_ID` for live viewing slots.
- `VAPI_WEBHOOK_SECRET` and Vapi URL config for phone agent testing.
- WhatsApp/Meta/Twilio credentials if you want outbound messages.

## Free-tier deployment

### Frontend on Vercel

```bash
cd frontend
vercel
```

Set `NEXT_PUBLIC_API_URL` to your backend URL.

### Backend via Docker

```bash
docker build -t astra-estate-api ./backend
docker run -p 8000:8000 --env-file .env astra-estate-api
```

### Vapi local testing with ngrok

```bash
ngrok http 8000
```

Use:

- Server URL: `https://<ngrok-url>/api/vapi/server-events`
- Custom LLM URL: `https://<ngrok-url>/api/vapi/custom-llm`

## How this wins hackathon + becomes market-ready

The judging story is not “we built a property chatbot.” It is:

1. A buyer searches in natural language and sees real Mumbai map pins.
2. Search ranking is not static filters; it considers redevelopment, inventory, EMI burden, construction/materials, and location semantics.
3. WhatsApp/call agents qualify and book viewings.
4. Tour Guide Agent creates a guided property walkthrough route.
5. Document Agent extracts legal milestones.
6. Negotiation Agent uses LP math while protecting hidden walk-away budgets.
7. Codex Agent Skill automates the broker-side heavy listing workflow.

This gives you the hackathon demo and a realistic go-to-market wedge for Mumbai brokers/builders before expanding city by city.

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
If you want the live backend to use Supabase, set `DATABASE_URL` in `.env` to your Supabase pooled Postgres connection string before starting Docker.

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

The manager portal tables are created on demand by the backend when `DATABASE_URL` is set, so Supabase is enough for live manager listing CRUD.

## ASTRA Auth System

ASTRA now includes a Supabase-backed authentication and authorization layer with local demo auth fallback.

Frontend routes:

- `/login`, `/signup`, `/auth/callback`, `/auth/verify-email`
- `/auth/forgot-password`, `/auth/reset-password`, `/auth/onboarding`, `/auth/select-role`, `/auth/unauthorized`
- `/account`, `/account/profile`, `/account/security`, `/account/billing-placeholder`, `/logout`

Protected route rules:

- Buyer portal `/buyer/*`: `buyer` or `admin`
- Manager portal `/manager/*`: `manager` or `admin`
- Broker portal `/broker/*`: `broker` or `admin`
- CRM portal `/crm/*`: `crm_user`, `manager`, or `admin`
- Account routes `/account/*`: any signed-in ASTRA role
- Public property and marketing routes remain public.

### Supabase Auth setup

1. Create a Supabase project.
2. Enable Email auth in Authentication providers.
3. Enable Google OAuth in Authentication providers.
4. Add site URL: `http://localhost:3000` locally and your production frontend URL in production.
5. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://<your-laptop-lan-ip>:3000/auth/callback` for phone testing on the same Wi-Fi
   - `https://<your-ngrok-domain>/auth/callback` for phone testing through ngrok
   - `https://your-vercel-domain.com/auth/callback`
6. Add password reset redirect URL:
   - `http://localhost:3000/auth/reset-password`
   - `http://<your-laptop-lan-ip>:3000/auth/reset-password`
   - `https://<your-ngrok-domain>/auth/reset-password`
   - `https://your-vercel-domain.com/auth/reset-password`
7. Run `backend/app/db/schema.sql` in the Supabase SQL editor.
8. Put frontend values in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_AUTH_REDIRECT_URL`
9. Put backend values in the API deployment:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `AUTH_PROVIDER=supabase`
   - `AUTH_MOCK_MODE=false`
   - `BACKEND_CORS_ORIGINS`

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or any `NEXT_PUBLIC_*` variable.

### Google OAuth setup

1. Open Google Cloud Console.
2. Configure the OAuth consent screen.
3. Create an OAuth client ID for a web application.
4. Copy the Supabase Google callback URL from Supabase Auth provider settings.
5. Add that URL to Google authorized redirect URIs.
6. Copy Google client ID and secret into the Supabase Google provider.
7. Test with the ASTRA button labelled `Continue with Google`.

If Supabase shows `Unsupported provider: provider is not enabled`, open Supabase Dashboard -> Authentication -> Providers -> Google and enable Google. The frontend cannot fix that error because Supabase rejects the OAuth request before returning to ASTRA.

### Confirmation links on mobile

Email confirmation, magic link, and password reset links must point to a URL your mobile device can reach. `localhost:3000` means "this same device", so it works on the laptop running Next.js but fails from a phone.

For mobile testing, set frontend env like one of these before starting Next.js:

```env
NEXT_PUBLIC_APP_URL=http://192.168.1.20:3000
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://192.168.1.20:3000/auth/callback
```

or:

```env
NEXT_PUBLIC_APP_URL=https://your-ngrok-domain.ngrok-free.app
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://your-ngrok-domain.ngrok-free.app/auth/callback
```

Then add the same callback and reset URLs to Supabase Auth redirect URLs. In production, use the deployed Vercel domain.

### Supabase email template copy

Confirm signup subject: `Confirm your ASTRA account`

Body: `Welcome to ASTRA. Confirm your email to start managing real estate workflows, property searches, broker tie-ups, and CRM automation.`

Reset password subject: `Reset your ASTRA password`

Body: `Use this secure link to reset your ASTRA password. If you did not request this, ignore this email.`

Magic link subject: `Your ASTRA login link`

Body: `Click this secure link to sign in to ASTRA.`

### Demo auth mode

For local demos without Supabase keys, set:

```env
NEXT_PUBLIC_AUTH_MOCK_MODE=true
AUTH_MOCK_MODE=true
```

Demo users are available on `/login`:

- `buyer@astra.local`
- `manager@astra.local`
- `broker@astra.local`
- `crm@astra.local`
- `admin@astra.local`

Do not enable mock auth in production.

## Implemented Automations

These are the automation surfaces implemented so far and exposed by the backend:

- Property search and ranking with semantic fallback and Mumbai market signals.
- WhatsApp lead qualification, reply generation, and Twilio send/webhook support.
- Voice triage through Vapi, now routed through the XR guide voice flow.
- AI guided tours for property pages and XR room-by-room navigation.
- Cal.com viewing-slot lookup and booking creation.
- Finance estimation for EMI, loan amount, and construction/material ranges.
- Market intelligence for inventory, redevelopment, and locality context.
- Negotiation optimization using the LP-based counter-offer engine.
- Document extraction for legal, contingency, and calendar reminders.
- Manager portal automation for publishing, leads, tasks, audit logs, and property listings.
- Broker portal automation for tie-ups, buyer matching, PropertyPool events, commissions, and follow-up tasks.
- AI assistant fallback for general workspace questions and product guidance.

## Environment variables

See `.env.example`. Required only for production-grade behavior:

- `OPENAI_API_KEY` for structured outputs, semantic embeddings, and document extraction.
- `DATABASE_URL` for Supabase/Postgres/pgvector. Use the Supabase pooled Postgres URI with SSL enabled.
- `CALCOM_API_KEY`, `CALCOM_EVENT_TYPE_ID` for live viewing slots.
- `VAPI_WEBHOOK_SECRET` and Vapi URL config for phone agent testing.
- WhatsApp/Meta/Twilio credentials if you want outbound messages.

## WhatsApp sandbox setup

For a free Twilio sandbox flow:

1. Run `ngrok http 8000` and copy the HTTPS URL.
2. In Twilio Console, point the WhatsApp inbound webhook to `https://<ngrok-url>/api/whatsapp/webhook`.
3. Set `WHATSAPP_PROVIDER=twilio` and keep `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` (sandbox sender) in `.env`.
4. Join the Twilio sandbox from your phone, then send a message to the sandbox number.

Outbound test:

```bash
curl -X POST http://localhost:8000/api/whatsapp/send \
  -H 'Content-Type: application/json' \
  -d '{"to":"+918209979629","message":"Test from ASTRA","dry_run":true}'
```

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

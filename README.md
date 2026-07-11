# GemmaRoute — Frontend

Next.js 16 chat interface and live metrics dashboard for the GemmaRoute AI routing engine.

[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://gemmaroute.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

**Live:** https://gemmaroute.vercel.app

---

## What It Does

Two panels:

**Chat (left):** Type any customer support question. Each response shows its routing decision — pulsing green dot for live backend, red dot for demo mode. Green label for local free routing, violet for cloud escalation with cost displayed.

**Dashboard (right):** Total cost saved, request count, average latency, quality score, route split bar, and a recent logs table with tier badges and skeleton loading states.

The app auto-detects backend availability every 3 seconds. When the backend is live, all data is real. When unreachable, it falls back to a local mock that routes prompts correctly using a weighted vocabulary scorer.

---

## Local Development

```bash
npm install
npm run dev
# http://localhost:3000
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=gemmaroute-demo-2026
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (Ngrok tunnel or local) | `http://localhost:8000` |
| `NEXT_PUBLIC_API_KEY` | Must match backend `API_KEY` | `gemmaroute-demo-2026` |

Set both in the Vercel project dashboard under Settings → Environment Variables, then redeploy.

---

## Connecting to the Live Backend

The backend runs locally via Ngrok. To connect:

1. Start uvicorn: `python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
2. Start Ngrok: `.\ngrok.exe http 8000`
3. Copy the Ngrok HTTPS URL
4. Update `NEXT_PUBLIC_API_URL` in Vercel env vars to the Ngrok URL
5. Redeploy — the header will show a pulsing green dot when connected

---

## API Contract

Shape expected from `POST /route`:

```json
{
  "response": "string",
  "routing": {
    "final_tier": "trivial|simple|medium|complex",
    "model_used": "string",
    "latency_ms": 0.0,
    "estimated_cost_usd": 0.0,
    "cost_saved_vs_max_usd": 0.0,
    "escalations": 0,
    "classifier_confidence": 0.0,
    "quality_score": 0.0
  },
  "session_id": "string"
}
```

Shape expected from `GET /stats`:

```json
{
  "total_requests": 0,
  "routing_distribution": {"trivial": 0, "simple": 0, "medium": 0, "complex": 0},
  "total_saved_vs_always_complex_usd": 0.0,
  "avg_latency_ms": 0.0,
  "avg_quality_score": 0.0
}
```

All calls include `X-API-Key` and `ngrok-skip-browser-warning` headers.
Route detection uses `final_tier` not model name — correctly handles circuit breaker fallback responses.

---

## Tier Colors

| Tier | Color |
|---|---|
| trivial | Emerald green |
| simple | Emerald green |
| medium | Amber |
| complex | Violet |

---

## Demo Prompts

| Prompt | Expected tier |
|---|---|
| `What are your business hours?` | trivial |
| `I want to return an item I bought last week` | medium |
| `I have a legal SLA violation regarding section 4B of my contract` | complex |

---

## Backend Repository

https://github.com/jezreal-dev/gemmaroute

---

## Built for AMD Developer Hackathon: ACT II — Track 3 (Open Innovation)
**Team:** Gemma Labs

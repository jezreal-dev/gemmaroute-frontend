# GemmaRoute — Frontend

**Next.js 16 chat interface and live metrics dashboard for the GemmaRoute AI routing engine.**

[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://gemmaroute.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

---

## Live

**https://gemmaroute.vercel.app**

The frontend auto-detects backend availability. When the backend is live, all stats and responses come from real routing decisions. When unreachable, the app falls back to an intelligent mock that correctly simulates all 4 tiers.

---

## What It Does

The UI has two panels:

**Left — Chat interface**
- Type any customer support question and press Enter or click Send
- Each AI response is labelled with its routing decision: `▸ routed local · $0.00` or `▸ escalated → Fireworks · $0.025`
- A green dot in the header means the live backend is connected

**Right — Live metrics dashboard**
- Total cost saved vs always using the most expensive model
- Request count with % local routing
- Average latency
- Average quality score
- Route split bar (local vs cloud)
- Recent routing log table (tier badge, model used, cost saved per request)

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
# Create .env.local with:
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=gemmaroute-demo-2026

# 3. Start the dev server
npm run dev
# → http://localhost:3000
```

The backend must be running on port 8000 for live routing. Without it, the app runs in demo mode with the mock fallback.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (Ngrok tunnel or local) | `http://localhost:8000` |
| `NEXT_PUBLIC_API_KEY` | Must match backend `API_KEY` | `gemmaroute-demo-2026` |

Set these in the Vercel project dashboard under **Settings → Environment Variables** to connect the deployed frontend to a live backend.

---

## Architecture

```
gemmaroute-frontend/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Main page — chat + dashboard
│   └── globals.css         # Tailwind v4 theme (OKLCH color tokens)
├── components/ui/
│   ├── SplashScreen.tsx    # 1.2s fade-in splash on load
│   ├── Logo.tsx            # GemmaRoute wordmark
│   ├── badge.tsx           # Tier color badges
│   ├── card.tsx            # Metric cards
│   ├── table.tsx           # Recent logs table
│   └── ...                 # shadcn/ui components
└── lib/
    └── api.ts              # All backend calls + mock fallback
```

### `lib/api.ts` — Key Design Decisions

**Route detection uses `final_tier`, not model name**
```ts
const isCloud = finalTier === "medium" || finalTier === "complex";
```
This correctly handles `[CB_FALLBACK]` responses — when the circuit breaker fires and Fireworks falls back to Ollama, the tier is still `medium` or `complex` so the routing label stays accurate.

**Intelligent mock fallback (no dependencies)**
When the backend is unreachable, `mockRoute()` uses a weighted vocabulary scorer (`scoreComplexity`) over ~100 domain-specific tokens to classify the prompt into the correct tier locally. This means the demo always works correctly regardless of backend status.

**Stats polling**
`fetchStats()` runs every 3 seconds via `setInterval`. The `backendLive` flag is updated on every poll and reflected in the header indicator.

**Cost savings accumulation**
```ts
const totalSavedDisplay = stats.totalSaved + runningSaved;
```
DB total from `/stats` plus current session savings — both shown together.

---

## API Contract

The frontend expects this shape from `POST /route`:

```json
{
  "response": "string",
  "routing": {
    "final_tier": "trivial|simple|medium|complex",
    "initial_tier": "trivial|simple|medium|complex",
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

And this shape from `GET /stats`:

```json
{
  "total_requests": 0,
  "routing_distribution": {
    "trivial": 0, "simple": 0, "medium": 0, "complex": 0
  },
  "total_saved_vs_always_complex_usd": 0.0,
  "avg_latency_ms": 0.0,
  "avg_quality_score": 0.0
}
```

All calls include `X-API-Key` header. The `ngrok-skip-browser-warning` header has been **removed** — it was triggering CORS preflights that Ngrok intercepted before FastAPI could respond.

---

## Tier Colors

| Tier | Color | Meaning |
|---|---|---|
| `trivial` | Emerald (green) | Heuristic filter — zero LLM cost |
| `simple` | Emerald (green) | Local Gemma 2B — zero cloud cost |
| `medium` | Amber (yellow) | Mixtral 8x7B via Fireworks |
| `complex` | Violet (purple) | LLaMA 405B via Fireworks |

---

## Branches & PRs

| Branch | Status | Description |
|---|---|---|
| `main` | Deployed to Vercel | Current live production |
| `fix/frontend-wiring-and-bugs` | **Open PR — needs merge** | All wiring fixes (see below) |
| `docs-update-readme` | Merged (#3) | README update |
| `fix-mock-fallback` | Merged (#1) | Mock routing tier upgrade |

### Pending PR: `fix/frontend-wiring-and-bugs`

**Merge this to update the live site:**
```
https://github.com/Nickysantus/gemmaroute/pull/new/fix/frontend-wiring-and-bugs
```

Changes in this PR:
- Remove `ngrok-skip-browser-warning` header (was causing CORS preflight failures)
- Fix `isCloud` detection to use `final_tier` instead of parsing model name strings
- Add `latencyMs` field to `RouteResult` type, wired from `routing.latency_ms`
- Fix `fetchStats` `localCount` to include `trivial` tier alongside `simple`
- Fix `totalSavedDisplay`: changed `||` to `+` so session savings accumulate on DB total
- Fix `tierColor`: `trivial` now gets green/emerald badge (was falling through to violet)
- Update mock `TIER_MODELS` to match real Gemma model names in `config.py`

---

## Changelog (Recent)

| Commit | Change |
|---|---|
| `9bcf2c3` | All wiring fixes — isCloud, latencyMs, trivial tier, totalSaved, mock models |
| `729e346` | Merge: ML mock scorer + ngrok header + live status tracking |
| `48ed8f6` | Merge PR #3: README docs update |
| `43eb0dd` | Fix tsconfig typo |
| `59f77f3` | Merge PR #1: mock fallback tier upgrade |

---

## Backend Repository

The FastAPI + LangGraph backend lives at:
**https://github.com/jezreal-dev/gemmaroute**

Latest backend commits:
- `ff3909c` — Hybrid 3-layer classifier + calibrated quality judge
- `3e5e427` — CORS fix, un-bypass nodes, cost savings, docker env fix

---

## Built for AMD Developer Hackathon: ACT II — Track 3 (Open Innovation)

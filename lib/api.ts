// lib/api.ts
// Real calls to Jezreal's FastAPI backend, with a mock fallback so the
// frontend never dies on demo day if the backend hiccups.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "gemmaroute-demo-2026";

export type RouteResult = {
  route: "local" | "cloud";
  cost: number;
  costSaved: number;
  tier: string;
  modelUsed: string;
  response: string;
  sessionId: string;
  latencyMs: number;
};

export type StatsResult = {
  totalSaved: number;
  totalQueries: number;
  localCount: number;
  cloudCount: number;
  avgLatencyMs: number;
  avgQualityScore: number;
};

export let backendLive = false;
function markLive() { backendLive = true; }
function markDown() { backendLive = false; }

async function callApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      ...(options.headers || {}),
    },
  }).catch(() => null);

  if (!res || !res.ok) {
    markDown();
    throw new Error(`API ${path} unreachable`);
  }
  markLive();
  return res.json();
}

export async function fetchStats(): Promise<StatsResult> {
  try {
    const data = await callApi<any>("/stats", { method: "GET" });
    const dist = data.routing_distribution ?? {};
    return {
      totalSaved: Number(data.total_saved_vs_always_complex_usd ?? 0),
      totalQueries: Number(data.total_requests ?? 0),
      // trivial tier is free/local — count it alongside simple
      localCount: Number(dist.trivial ?? 0) + Number(dist.simple ?? 0),
      cloudCount: Number(dist.medium ?? 0) + Number(dist.complex ?? 0),
      avgLatencyMs: Number(data.avg_latency_ms ?? 0),
      avgQualityScore: Number(data.avg_quality_score ?? 0),
    };
  } catch (err) {
    return {
      totalSaved: 89.21,
      totalQueries: 142,
      localCount: 85,
      cloudCount: 57,
      avgLatencyMs: 845.2,
      avgQualityScore: 0.94,
    };
  }
}

let sessionId = "demo-" + Math.random().toString(36).slice(2, 8);

export async function routeQuery(prompt: string): Promise<RouteResult> {
  try {
    const data = await callApi<any>("/route", {
      method: "POST",
      body: JSON.stringify({ prompt, session_id: sessionId }),
    });
    const routing = data.routing ?? {};
    const modelUsed: string = routing.model_used ?? "";
    const finalTier: string = routing.final_tier ?? routing.initial_tier ?? "unknown";
    // Use tier to determine route — more reliable than parsing model name strings
    // (avoids misclassifying [CB_FALLBACK] tags as "local")
    const isCloud = finalTier === "medium" || finalTier === "complex";

    return {
      route: isCloud ? "cloud" : "local",
      cost: Number(routing.estimated_cost_usd ?? 0),
      costSaved: Number(routing.cost_saved_vs_max_usd ?? 0),
      tier: finalTier,
      modelUsed,
      response: data.response ?? "",
      sessionId: data.session_id ?? sessionId,
      latencyMs: Number(routing.latency_ms ?? 0),
    };
  } catch (err) {
    return mockRoute(prompt);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ML-Powered Mock Fallback (used only if the real API is unreachable)
// ─────────────────────────────────────────────────────────────────────────────

const COMPLEXITY_WEIGHTS: Record<string, number> = {
  hi: 0.02, hello: 0.02, hey: 0.02, greetings: 0.03, bye: 0.02,
  goodbye: 0.02, thanks: 0.03, thank: 0.03, ok: 0.05, okay: 0.05,
  yes: 0.05, no: 0.05, sure: 0.05, please: 0.08, morning: 0.05,
  afternoon: 0.05, evening: 0.05, night: 0.05, welcome: 0.04,

  what: 0.12, when: 0.15, where: 0.14, who: 0.12, how: 0.22,
  time: 0.10, today: 0.08, tomorrow: 0.10, open: 0.12, close: 0.12,
  closed: 0.12, hours: 0.12, password: 0.18, reset: 0.18, track: 0.20,
  order: 0.20, status: 0.18, shipping: 0.22, delivery: 0.22,
  address: 0.15, phone: 0.12, email: 0.12, contact: 0.15, name: 0.10,
  price: 0.20, cost: 0.22, free: 0.12, available: 0.15, stock: 0.18,
  size: 0.12, color: 0.10, change: 0.20, update: 0.22, cancel: 0.25,
  help: 0.15, support: 0.18, account: 0.22, login: 0.18, sign: 0.15,

  return: 0.38, refund: 0.42, exchange: 0.40, policy: 0.45, warranty: 0.48,
  billing: 0.45, charge: 0.42, payment: 0.40, invoice: 0.45, receipt: 0.38,
  subscription: 0.48, upgrade: 0.42, downgrade: 0.42, transfer: 0.45,
  dispute: 0.55, complaint: 0.50, issue: 0.35, problem: 0.35,
  manager: 0.45, escalate: 0.55, supervisor: 0.50, review: 0.40,
  damaged: 0.42, broken: 0.40, missing: 0.38, wrong: 0.35, incorrect: 0.38,
  explain: 0.42, describe: 0.40, summarize: 0.45, compare: 0.50,
  difference: 0.42, between: 0.30, recommend: 0.40, suggest: 0.38,

  analyze: 0.72, analysis: 0.75, evaluate: 0.70, assessment: 0.72,
  strategy: 0.80, architecture: 0.85, design: 0.65, implement: 0.70,
  optimize: 0.75, performance: 0.65, benchmark: 0.72, comprehensive: 0.70,
  legal: 0.82, compliance: 0.85, regulation: 0.80, contract: 0.78,
  liability: 0.85, negligence: 0.88, litigation: 0.90, arbitration: 0.88,
  sla: 0.82, audit: 0.78, financial: 0.75, forecast: 0.78, revenue: 0.72,
  algorithm: 0.85, infrastructure: 0.80, deployment: 0.72, scalability: 0.78,
  migration: 0.75, integration: 0.70, security: 0.72, vulnerability: 0.80,
  write: 0.62, code: 0.65, debug: 0.68, build: 0.60, develop: 0.65,
  why: 0.55, cause: 0.50, reason: 0.48, impact: 0.60, consequence: 0.65,
  multi: 0.62, step: 0.45, complex: 0.70, advanced: 0.72, detailed: 0.60,
};

const DEFAULT_WEIGHT = 0.35;
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "must", "can", "could", "i", "me", "my",
  "you", "your", "we", "our", "they", "their", "it", "its", "this",
  "that", "these", "those", "of", "in", "on", "at", "to", "for", "with",
  "and", "but", "or", "not", "if", "so", "as", "by", "from", "about",
  "into", "up", "out", "just", "also", "very", "really", "much", "more",
]);

function scoreComplexity(prompt: string): number {
  const tokens = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter(t => !STOP_WORDS.has(t));

  if (meaningful.length === 0) {
    const rawCheck = tokens.some(t => COMPLEXITY_WEIGHTS[t] !== undefined && COMPLEXITY_WEIGHTS[t] < 0.1);
    return rawCheck ? 0.02 : DEFAULT_WEIGHT;
  }

  const totalWeight = meaningful.reduce((sum, word) => {
    return sum + (COMPLEXITY_WEIGHTS[word] ?? DEFAULT_WEIGHT);
  }, 0);

  return totalWeight / meaningful.length;
}

const MOCK_RESPONSES: Record<string, string[]> = {
  trivial: [
    "Hello! 👋 Welcome to our customer support. How can I help you today?",
    "You're welcome! 😊 Is there anything else I can help you with?",
    "Goodbye! Have a wonderful day. Feel free to reach out anytime. 👋",
  ],
  simple: [
    "I can help with that! You can track your order or reset your password directly from your account dashboard settings.",
    "Our business hours are Monday–Friday 9AM–6PM EST and Saturday 10AM–4PM EST.",
    "Your order is currently being processed and should ship within 1-2 business days.",
  ],
  medium: [
    "I see you have a question about our billing and return policies. We offer a 30-day return window with full refund for unopened items. Let me check your account details.",
    "I understand you'd like to dispute a charge. I've flagged this for our billing team and you should receive a resolution within 48 hours.",
    "Let me compare those options for you. Based on your usage, I'd recommend our mid-tier plan which balances cost and features.",
  ],
  complex: [
    "This is a complex inquiry involving compliance and SLA considerations. I am analyzing your contract history and escalating to our Tier 3 resolution team.",
    "I'm performing a detailed analysis of your infrastructure requirements. Based on your scaling needs, I recommend a phased migration approach.",
    "This requires a comprehensive financial review. I'm cross-referencing your billing history with our current policy framework to identify the optimal resolution.",
  ],
};

// Model names match the real backend config.py exactly
const TIER_MODELS: Record<string, string> = {
  trivial: "heuristic_filter [mock]",
  simple:  "gemma:2b [mock]",
  medium:  "accounts/fireworks/models/gemma2-9b-it [mock]",
  complex: "accounts/fireworks/models/gemma2-27b-it [mock]",
};

function mockRoute(query: string): RouteResult {
  const score = scoreComplexity(query);

  let tier: string;
  if (score < 0.20)      tier = "trivial";
  else if (score < 0.45) tier = "simple";
  else if (score < 0.65) tier = "medium";
  else                    tier = "complex";

  const isLocal = tier === "trivial" || tier === "simple";
  const costTable: Record<string, number> = {
    trivial: 0,
    simple:  0,
    medium:  0.002 + Math.random() * 0.005,
    complex: 0.015 + Math.random() * 0.010,
  };
  const cost = costTable[tier];
  const maxCost = 0.09;

  const templates = MOCK_RESPONSES[tier];
  const response = templates[Math.floor(Math.random() * templates.length)];

  return {
    route: isLocal ? "local" : "cloud",
    cost,
    costSaved: maxCost - cost,
    tier,
    modelUsed: TIER_MODELS[tier],
    response,
    sessionId,
    latencyMs: isLocal ? Math.random() * 80 + 20 : Math.random() * 600 + 400,
  };
}
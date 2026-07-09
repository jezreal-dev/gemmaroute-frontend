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
      "ngrok-skip-browser-warning": "69420",
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
      localCount: Number(dist.simple ?? 0),
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
    const isCloud = modelUsed.toLowerCase().includes("fireworks");

    return {
      route: isCloud ? "cloud" : "local",
      cost: Number(routing.estimated_cost_usd ?? 0),
      costSaved: Number(routing.cost_saved_vs_max_usd ?? 0),
      tier: routing.final_tier ?? routing.initial_tier ?? "unknown",
      modelUsed,
      response: data.response ?? "",
      sessionId: data.session_id ?? sessionId,
    };
  } catch (err) {
    return mockRoute(prompt);
  }
}

// --- Mock fallback (used only if the real API is unreachable) ---
function mockRoute(query: string): RouteResult {
  const lower = query.toLowerCase();

  if (["hi", "hello", "thanks", "bye"].some((h) => lower.includes(h))) {
    return {
      route: "local", cost: 0, costSaved: 0.03, tier: "trivial",
      modelUsed: "heuristic_filter [mock]",
      response: "Hello! 👋 Welcome to our customer support. How can I help you today?",
      sessionId,
    };
  }

  if (["password", "hours", "status", "track", "order"].some((h) => lower.includes(h))) {
    return {
      route: "local", cost: 0, costSaved: 0.03, tier: "simple",
      modelUsed: "ollama/gemma:2b [mock]",
      response: "I can help with that! You can track your order or reset your password directly from your account dashboard settings.",
      sessionId,
    };
  }

  if (["policy", "return", "billing", "charge"].some((h) => lower.includes(h))) {
    const cost = 0.002 + Math.random() * 0.005;
    return {
      route: "cloud", cost, costSaved: 0.03 - cost, tier: "medium",
      modelUsed: "accounts/fireworks/models/mixtral-8x7b-instruct [mock]",
      response: "I see you have a question about our billing and return policies. We offer a 30-day return window. Let me check your account details to assist further.",
      sessionId,
    };
  }

  const cost = 0.015 + Math.random() * 0.01;
  return {
    route: "cloud", cost, costSaved: 0.09 - cost, tier: "complex",
    modelUsed: "accounts/fireworks/models/llama-v3p1-405b-instruct [mock]",
    response: "This is a complex inquiry regarding compliance and SLA disputes. I am analyzing your contract history and escalating this to our Tier 3 resolution team. Please hold.",
    sessionId,
  };
}
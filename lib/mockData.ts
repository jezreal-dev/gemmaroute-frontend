export const mockRouteResponse = {
  response: "Our business hours are Monday to Friday, 9 AM to 6 PM EST.",
  session_id: "demo-session-001",
  routing: {
    initial_tier: "simple",
    final_tier: "complex",
    escalations: 1,
    classifier_confidence: 0.85,
    quality_score: 0.92,
    model_used: "accounts/fireworks/models/mixtral-8x7b-instruct",
    latency_ms: 1250.5,
    estimated_cost_usd: 0.00015,
    cost_saved_vs_max_usd: 0.00085
  }
};

export const mockStats = {
  total_requests: 142,
  routing_distribution: {
    simple: 85,
    medium: 40,
    complex: 17
  },
  total_cost_usd: 0.04521,
  total_saved_vs_always_complex_usd: 0.89215,
  avg_latency_ms: 845.2,
  avg_quality_score: 0.94,
  escalation_rate: 0.12,
  recent_logs: [
    {
      id: 142,
      session_id: "user-session-id",
      prompt_preview: "User's messag...",
      initial_tier: "simple",
      final_tier: "complex",
      model_used: "mixtral",
      escalations: 1,
      quality_score: 0.92,
      latency_ms: 1250.5,
      cost_usd: 0.00015,
      saved_usd: 0.00085,
      created_at: "2026-07-08T11:45:00.000Z"
    }
  ]
};
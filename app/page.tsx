"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, Cloud, TrendingDown, Activity, Gauge } from "lucide-react";
import { routeQuery, fetchStats, type RouteResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { Logo } from "@/components/ui/Logo";
import { backendLive } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  text: string;
  route?: "local" | "cloud";
  cost?: number;
};

type LogRow = {
  id: number;
  prompt: string;
  tier: string;
  model: string;
  latencyMs: number;
  cost: number;
  saved: number;
};

function tierColor(tier: string) {
  if (tier === "trivial" || tier === "local" || tier === "simple") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (tier === "medium") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-violet-500/15 text-violet-400 border-violet-500/30";
}

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Ask me anything — simple stuff stays local and free, harder stuff escalates to the cloud automatically." },
  ]);
  const [isLive, setIsLive] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ totalSaved: 0, totalQueries: 0, localCount: 0, cloudCount: 0, avgLatencyMs: 0, avgQualityScore: 0 });
  const [runningSaved, setRunningSaved] = useState(0);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const load = () => fetchStats().then((s) => { setStats(s); setIsLive(backendLive); }).catch(() => setIsLive(false));
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);

    const result: RouteResult = await routeQuery(text);

    setMessages((m) => [...m, { role: "assistant", text: result.response, route: result.route, cost: result.cost }]);
    setRunningSaved((s) => s + result.costSaved);
    setLogs((prev) => [
      {
        id: Date.now(),
        prompt: text.length > 40 ? text.slice(0, 40) + "..." : text,
        tier: result.tier,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        cost: result.cost,
        saved: result.costSaved,
      },
      ...prev,
    ].slice(0, 8));
    setSending(false);
    fetchStats().then(setStats).catch(() => {});
  }

  const localPct = stats.totalQueries ? Math.round((stats.localCount / stats.totalQueries) * 100) : null;
  // Use DB total as the base; add current session's savings on top
  const totalSavedDisplay = stats.totalSaved + runningSaved;
  
  if (showSplash) {
  return <SplashScreen onDone={() => setShowSplash(false)} />;
}

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono tracking-[2px] text-emerald-400">AMD AI HACKATHON · TRACK 3</div>
          <Logo size={26} />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Activity size={14} className={isLive ? "text-emerald-400" : "text-zinc-600"} />
          {isLive ? "live backend" : "demo mode"}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 gap-6 p-6">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-h-[420px]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 max-h-[460px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                {m.role === "assistant" && m.route && (
                  <div
                    className={`flex items-center gap-1 text-[11px] font-mono mb-1 opacity-90 ${
                      m.route === "local" ? "text-emerald-400" : "text-violet-400"
                    }`}
                  >
                    {m.route === "local" ? <Zap size={11} /> : <Cloud size={11} />}
                    {m.route === "local" ? "▸ routed local · $0.00" : `▸ escalated → Fireworks · $${(m.cost ?? 0).toFixed(3)}`}
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[80%] border border-zinc-800 ${
                    m.role === "user" ? "bg-zinc-800" : "bg-zinc-900"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && <div className="text-zinc-400 font-mono text-xs">routing…</div>}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Ask a customer support question
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a customer support question…"
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            />
            <button
              onClick={send}
              disabled={sending}
              title="Send message"
              aria-label="Send message"
              className="rounded-xl px-4 py-3 flex items-center justify-center font-semibold bg-emerald-400 text-zinc-950 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Right: Dashboard */}
        <div className="w-full xl:w-[420px] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <TrendingDown size={13} className="text-amber-400" /> TOTAL SAVED
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-amber-400">${totalSavedDisplay.toFixed(3)}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Zap size={13} className="text-emerald-400" /> REQUESTS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold">{stats.totalQueries}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{localPct ?? 0}% local</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Gauge size={13} className="text-sky-400" /> AVG LATENCY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold">{(stats.avgLatencyMs ?? 0).toFixed(0)}ms</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Activity size={13} className="text-rose-400" /> QUALITY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold">{(stats.avgQualityScore * 100).toFixed(0)}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className="text-[11px] font-mono text-zinc-400 mb-2">ROUTE SPLIT</div>
            <div className="bg-zinc-950 rounded-md overflow-hidden h-2.5 flex">
               {localPct === null ? (
                 <div className="bg-zinc-800 h-full w-full" />
             ) : (
               <>
                  <div className="bg-emerald-400 h-full" style={{ width: `${localPct}%` }} />
                  <div className="bg-violet-400 h-full" style={{ width: `${100 - localPct}%` }} />
               </>
          )}
         </div>
            <div className="flex justify-between mt-2 text-[11px] font-mono text-zinc-500">
              <span className="text-emerald-400">{stats.localCount} local</span>
              <span className="text-violet-400">{stats.cloudCount} cloud</span>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-zinc-300">RECENT LOGS</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-xs text-zinc-500 font-mono">Send a message to see logs here.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">Prompt</TableHead>
                      <TableHead className="text-zinc-500">Tier</TableHead>
                      <TableHead className="text-zinc-500 text-right">Saved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300 font-mono text-xs">{log.prompt}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tierColor(log.tier)}>
                            {log.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-400">${log.saved.toFixed(5)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
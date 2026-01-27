# 第5章: リアルタイム更新

## リアルタイムアーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│            Realtime Architecture                     │
│                                                     │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐      │
│  │ Client  │◀───▶│   SSE   │◀───▶│ Server  │      │
│  │         │     │ Stream  │     │         │      │
│  └─────────┘     └─────────┘     └────┬────┘      │
│                                       │            │
│                         ┌─────────────┼────────────┤
│                         ▼             ▼            │
│                  ┌─────────┐   ┌─────────┐        │
│                  │ BigQuery│   │  Redis  │        │
│                  │  (集計) │   │ (Pub/Sub)│        │
│                  └─────────┘   └─────────┘        │
└─────────────────────────────────────────────────────┘
```

## Server-Sent Events（SSE）

### サーバー側

```typescript
// app/api/realtime/stream/route.ts
import { getKPIs } from "@/lib/analytics/queries";

export const runtime = "edge";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 初回データ送信
      const initialData = await getKPIs(1);
      sendEvent({ type: "initial", data: initialData });

      // 定期更新（30秒ごと）
      const interval = setInterval(async () => {
        try {
          const kpis = await getKPIs(1);
          sendEvent({ type: "update", data: kpis });
        } catch (error) {
          sendEvent({ type: "error", message: "データ取得エラー" });
        }
      }, 30000);

      // クリーンアップ
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### クライアント側

```typescript
// hooks/useRealtimeKPIs.ts
import { useState, useEffect, useCallback } from "react";

interface KPIData {
  sessions: number;
  users: number;
  revenue: number;
}

export function useRealtimeKPIs() {
  const [data, setData] = useState<KPIData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/realtime/stream");

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "update" || parsed.type === "initial") {
          setData(parsed.data[0]);
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError(new Error("接続が切断されました"));
      eventSource.close();

      // 5秒後に再接続
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    return () => eventSource.close();
  }, []);

  return { data, isConnected, error };
}
```

## TanStack Query でのポーリング

```typescript
// hooks/usePollingKPIs.ts
import { useQuery } from "@tanstack/react-query";

export function usePollingKPIs(
  days: number = 1,
  refetchInterval: number = 30000,
) {
  return useQuery({
    queryKey: ["kpis", "realtime", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/kpis?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const { data } = await res.json();
      return data;
    },
    refetchInterval,
    refetchIntervalInBackground: true,
    staleTime: refetchInterval / 2,
  });
}
```

## AI ストリーミング分析

### サーバー側

```typescript
// app/api/realtime/ai-analysis/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getKPIs } from "@/lib/analytics/queries";

export async function POST(req: Request) {
  const { question } = await req.json();

  // 最新データを取得
  const kpis = await getKPIs(7);

  const result = streamText({
    model: openai("gpt-4o"),
    system: `あなたはリアルタイムデータアナリストです。
最新のKPIデータを分析し、インサイトを提供してください。

現在のKPIデータ:
${JSON.stringify(kpis, null, 2)}`,
    prompt: question,
  });

  return result.toDataStreamResponse();
}
```

### クライアント側

```typescript
// components/realtime/AIAnalysis.tsx
"use client";

import { useChat } from "ai/react";

export function RealtimeAIAnalysis() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/realtime/ai-analysis",
    });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">🤖 AI リアルタイム分析</h3>

      <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.role === "user" ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}

        {isLoading && (
          <div className="p-3 rounded-lg bg-gray-100 animate-pulse">
            <p className="text-sm">分析中...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="現在の状況について質問..."
          className="flex-1 p-2 border rounded-lg text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
        >
          分析
        </button>
      </form>
    </div>
  );
}
```

## 異常検知と通知

### 異常検知ロジック

```typescript
// lib/analytics/anomaly-detection.ts
interface KPIData {
  date: string;
  revenue: number;
  users: number;
  sessions: number;
}

interface Anomaly {
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: "warning" | "critical";
}

export function detectAnomalies(
  current: KPIData,
  historical: KPIData[],
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const metrics = ["revenue", "users", "sessions"] as const;

  for (const metric of metrics) {
    const values = historical.map((d) => d[metric] as number);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length,
    );

    const currentValue = current[metric] as number;
    const deviation = (currentValue - mean) / stdDev;

    if (Math.abs(deviation) > 2) {
      anomalies.push({
        metric,
        currentValue,
        expectedValue: mean,
        deviation,
        severity: Math.abs(deviation) > 3 ? "critical" : "warning",
      });
    }
  }

  return anomalies;
}
```

### 通知コンポーネント

```typescript
// components/realtime/AnomalyAlert.tsx
"use client";

import { useEffect, useState } from "react";

interface Anomaly {
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: "warning" | "critical";
}

export function AnomalyAlert() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    const checkAnomalies = async () => {
      const res = await fetch("/api/analytics/anomalies");
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies);
      }
    };

    checkAnomalies();
    const interval = setInterval(checkAnomalies, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, []);

  if (anomalies.length === 0) return null;

  const metricNames: Record<string, string> = {
    revenue: "売上",
    users: "ユーザー数",
    sessions: "セッション数",
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {anomalies.map((anomaly, i) => (
        <div
          key={i}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${
            anomaly.severity === "critical"
              ? "bg-red-500 text-white"
              : "bg-yellow-500 text-black"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {anomaly.severity === "critical" ? "🚨" : "⚠️"}
            </span>
            <div>
              <p className="font-bold">
                {metricNames[anomaly.metric]}が異常値です
              </p>
              <p className="text-sm">
                現在: {anomaly.currentValue.toLocaleString()} /
                期待値: {anomaly.expectedValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## リアルタイムダッシュボード

```typescript
// app/realtime/page.tsx
"use client";

import { KPICard } from "@/components/dashboard/KPICard";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { RealtimeAIAnalysis } from "@/components/realtime/AIAnalysis";
import { AnomalyAlert } from "@/components/realtime/AnomalyAlert";
import { useRealtimeKPIs } from "@/hooks/useRealtimeKPIs";
import { usePollingKPIs } from "@/hooks/usePollingKPIs";

export default function RealtimeDashboard() {
  const { data: realtimeData, isConnected } = useRealtimeKPIs();
  const { data: historicalData } = usePollingKPIs(7, 60000);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 接続状態 */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? "リアルタイム接続中" : "再接続中..."}
        </span>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="売上（今日）"
          value={realtimeData?.revenue || 0}
          format="currency"
        />
        <KPICard
          title="ユーザー数（今日）"
          value={realtimeData?.users || 0}
        />
        <KPICard
          title="セッション数（今日）"
          value={realtimeData?.sessions || 0}
        />
      </div>

      {/* チャートと AI 分析 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <TimeSeriesChart
            data={historicalData || []}
            title="売上推移（過去7日）"
          />
        </div>
        <RealtimeAIAnalysis />
      </div>

      {/* 異常検知アラート */}
      <AnomalyAlert />
    </div>
  );
}
```

## 次のステップ

次章では、AI インサイト生成について学びます。

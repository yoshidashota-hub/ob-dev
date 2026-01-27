# 第6章: AI インサイト

## 自動インサイト生成

```
┌─────────────────────────────────────────────────────┐
│            AI Insight Generation                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Data Sources                    │   │
│  │  • KPIs  • Sales  • Events  • Trends       │   │
│  └─────────────────────────────────────────────┘   │
│                      │                             │
│                      ▼                             │
│  ┌─────────────────────────────────────────────┐   │
│  │              AI Analysis                     │   │
│  │  • パターン認識                              │   │
│  │  • トレンド分析                              │   │
│  │  • 異常検知                                  │   │
│  │  • 相関分析                                  │   │
│  └─────────────────────────────────────────────┘   │
│                      │                             │
│                      ▼                             │
│  ┌─────────────────────────────────────────────┐   │
│  │              Insights                        │   │
│  │  • サマリー  • 推奨  • 予測  • アラート    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## インサイトスキーマ

```typescript
// lib/ai/insight-schemas.ts
import { z } from "zod";

// 日次レポートスキーマ
export const dailyReportSchema = z.object({
  date: z.string(),
  summary: z.string().describe("1-2文での要約"),
  highlights: z
    .array(
      z.object({
        type: z.enum(["positive", "negative", "neutral"]),
        title: z.string(),
        description: z.string(),
        metric: z.string(),
        value: z.string(),
      }),
    )
    .max(5),
  concerns: z.array(z.string()).describe("注意が必要な点"),
  opportunities: z.array(z.string()).describe("改善の機会"),
});

// 週次レポートスキーマ
export const weeklyReportSchema = z.object({
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
  executiveSummary: z.string().describe("エグゼクティブサマリー"),
  kpiSummary: z.array(
    z.object({
      name: z.string(),
      currentValue: z.number(),
      previousValue: z.number(),
      change: z.number(),
      trend: z.enum(["up", "down", "stable"]),
      analysis: z.string(),
    }),
  ),
  topPerformers: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    }),
  ),
  areasOfConcern: z.array(
    z.object({
      issue: z.string(),
      impact: z.enum(["high", "medium", "low"]),
      recommendation: z.string(),
    }),
  ),
  nextWeekFocus: z.array(z.string()),
});

// トレンド分析スキーマ
export const trendAnalysisSchema = z.object({
  metric: z.string(),
  period: z.string(),
  trend: z.object({
    direction: z.enum(["increasing", "decreasing", "stable", "volatile"]),
    strength: z.enum(["strong", "moderate", "weak"]),
    confidence: z.number().min(0).max(1),
  }),
  seasonality: z.object({
    detected: z.boolean(),
    pattern: z.string().optional(),
  }),
  forecast: z.object({
    nextPeriod: z.number(),
    confidence: z.number().min(0).max(1),
    factors: z.array(z.string()),
  }),
  insights: z.array(z.string()),
});
```

## 日次レポート生成

```typescript
// lib/ai/daily-report.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { dailyReportSchema } from "./insight-schemas";
import { getKPIs, getTopProducts } from "@/lib/analytics/queries";

export async function generateDailyReport(date?: string) {
  const targetDate = date || new Date().toISOString().split("T")[0];

  // データ取得
  const [todayKPIs, yesterdayKPIs, topProducts] = await Promise.all([
    getKPIs(1),
    getKPIs(2),
    getTopProducts(1, 5),
  ]);

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: dailyReportSchema,
    prompt: `以下のデータを分析し、${targetDate}の日次レポートを生成してください。

## 今日のKPI
${JSON.stringify(todayKPIs[0], null, 2)}

## 昨日のKPI（比較用）
${JSON.stringify(yesterdayKPIs[1], null, 2)}

## 本日の売上トップ5商品
${JSON.stringify(topProducts, null, 2)}

分析のポイント:
1. 前日比での変化を分析
2. 特筆すべきパフォーマンスを特定
3. 改善が必要な領域を指摘
4. 具体的な数値を含める`,
  });

  return result.object;
}
```

## 週次レポート生成

```typescript
// lib/ai/weekly-report.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { weeklyReportSchema } from "./insight-schemas";
import {
  getKPIs,
  getTopProducts,
  getTimeSeries,
} from "@/lib/analytics/queries";

export async function generateWeeklyReport() {
  // データ取得
  const [thisWeekKPIs, lastWeekKPIs, topProducts, timeSeries] =
    await Promise.all([
      getKPIs(7),
      getKPIs(14),
      getTopProducts(7, 10),
      getTimeSeries("revenue", 14, "day"),
    ]);

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: weeklyReportSchema,
    prompt: `以下のデータを分析し、週次レポートを生成してください。

## 今週のKPI（日別）
${JSON.stringify(thisWeekKPIs, null, 2)}

## 先週のKPI（比較用）
${JSON.stringify(lastWeekKPIs.slice(7), null, 2)}

## 売上トップ10商品
${JSON.stringify(topProducts, null, 2)}

## 売上推移（2週間）
${JSON.stringify(timeSeries, null, 2)}

レポートのポイント:
1. 週全体のパフォーマンス評価
2. 前週比での改善/悪化点
3. カテゴリ別の傾向
4. 来週に向けた提案`,
  });

  return result.object;
}
```

## トレンド分析

```typescript
// lib/ai/trend-analysis.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { trendAnalysisSchema } from "./insight-schemas";
import { getTimeSeries } from "@/lib/analytics/queries";

export async function analyzeTrend(
  metric: "revenue" | "users" | "sessions",
  days: number = 30,
) {
  const timeSeries = await getTimeSeries(metric, days, "day");

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: trendAnalysisSchema,
    prompt: `以下の${metric}の時系列データを分析してください。

## データ（過去${days}日間）
${JSON.stringify(timeSeries, null, 2)}

分析のポイント:
1. 全体的なトレンド（上昇/下降/横ばい）
2. 季節性やパターンの有無
3. 異常値や急激な変化
4. 次の期間の予測
5. トレンドに影響を与えている可能性のある要因`,
  });

  return result.object;
}
```

## API エンドポイント

```typescript
// app/api/reports/daily/route.ts
import { NextResponse } from "next/server";
import { generateDailyReport } from "@/lib/ai/daily-report";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;

  try {
    const report = await generateDailyReport(date);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "レポート生成に失敗しました" },
      { status: 500 },
    );
  }
}
```

```typescript
// app/api/reports/weekly/route.ts
import { NextResponse } from "next/server";
import { generateWeeklyReport } from "@/lib/ai/weekly-report";

export async function GET() {
  try {
    const report = await generateWeeklyReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "レポート生成に失敗しました" },
      { status: 500 },
    );
  }
}
```

## レポートコンポーネント

```typescript
// components/reports/DailyReport.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

interface Highlight {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  metric: string;
  value: string;
}

interface DailyReport {
  date: string;
  summary: string;
  highlights: Highlight[];
  concerns: string[];
  opportunities: string[];
}

export function DailyReport({ date }: { date?: string }) {
  const { data, isLoading, error } = useQuery<DailyReport>({
    queryKey: ["dailyReport", date],
    queryFn: async () => {
      const url = date
        ? `/api/reports/daily?date=${date}`
        : "/api/reports/daily";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10分
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-red-500">レポートの取得に失敗しました</p>
      </div>
    );
  }

  const typeStyles = {
    positive: "border-green-500 bg-green-50",
    negative: "border-red-500 bg-red-50",
    neutral: "border-gray-300 bg-gray-50",
  };

  const typeIcons = {
    positive: "📈",
    negative: "📉",
    neutral: "➡️",
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">日次レポート</h2>
      <p className="text-gray-500 mb-4">{data.date}</p>

      {/* サマリー */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-gray-700">{data.summary}</p>
      </div>

      {/* ハイライト */}
      <h3 className="font-semibold mb-3">📊 ハイライト</h3>
      <div className="space-y-3 mb-6">
        {data.highlights.map((highlight, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg border-l-4 ${typeStyles[highlight.type]}`}
          >
            <div className="flex items-center gap-2">
              <span>{typeIcons[highlight.type]}</span>
              <span className="font-medium">{highlight.title}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{highlight.description}</p>
            <p className="text-sm font-medium mt-1">
              {highlight.metric}: {highlight.value}
            </p>
          </div>
        ))}
      </div>

      {/* 注意点 */}
      {data.concerns.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">⚠️ 注意点</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {data.concerns.map((concern, i) => (
              <li key={i}>{concern}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 機会 */}
      {data.opportunities.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">💡 改善の機会</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {data.opportunities.map((opportunity, i) => (
              <li key={i}>{opportunity}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## レポートページ

```typescript
// app/reports/page.tsx
"use client";

import { useState } from "react";
import { DailyReport } from "@/components/reports/DailyReport";
import { WeeklyReport } from "@/components/reports/WeeklyReport";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly">("daily");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI レポート</h1>

        {/* タブ */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setReportType("daily")}
            className={`px-4 py-2 rounded-lg ${
              reportType === "daily"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            日次レポート
          </button>
          <button
            onClick={() => setReportType("weekly")}
            className={`px-4 py-2 rounded-lg ${
              reportType === "weekly"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            週次レポート
          </button>
        </div>

        {/* レポート表示 */}
        {reportType === "daily" ? <DailyReport /> : <WeeklyReport />}
      </div>
    </div>
  );
}
```

## 次のステップ

次章では、ベストプラクティスについて学びます。

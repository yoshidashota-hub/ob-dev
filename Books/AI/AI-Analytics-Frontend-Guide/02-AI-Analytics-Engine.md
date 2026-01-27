# 第2章: AI 分析エンジン

## AI によるデータ分析

```
┌─────────────────────────────────────────────────────┐
│              AI Analytics Engine                     │
│                                                     │
│  User Query: "売上が減少した原因は？"                │
│           │                                         │
│           ▼                                         │
│  ┌─────────────────────────────────────────────┐   │
│  │              AI SDK                          │   │
│  │  1. クエリを解析                             │   │
│  │  2. 必要なデータを特定                       │   │
│  │  3. SQL/分析ツールを呼び出し                 │   │
│  │  4. 結果を解釈・要約                         │   │
│  └─────────────────────────────────────────────┘   │
│           │                                         │
│           ▼                                         │
│  Response: "売上減少の主な原因は..."               │
│            + グラフ + 推奨アクション               │
└─────────────────────────────────────────────────────┘
```

## AI ツールの定義

```typescript
// lib/ai/tools.ts
import { tool } from "ai";
import { z } from "zod";
import { executeQuery, getKPIs, getTopProducts } from "@/lib/analytics/queries";

// SQLクエリ実行ツール
export const executeSQLTool = tool({
  description: `BigQuery でSQLクエリを実行します。
使用可能なテーブル:
- analytics.events (id, event_name, user_id, properties, timestamp)
- analytics.sales (id, product_id, product_name, category, quantity, total_amount, timestamp)
- analytics.daily_kpis (date, sessions, users, purchases, revenue)`,
  parameters: z.object({
    sql: z.string().describe("実行するSQLクエリ"),
    description: z.string().describe("クエリの目的の説明"),
  }),
  execute: async ({ sql, description }) => {
    try {
      // 危険なクエリをブロック
      if (
        sql.toLowerCase().includes("drop") ||
        sql.toLowerCase().includes("delete") ||
        sql.toLowerCase().includes("update") ||
        sql.toLowerCase().includes("insert")
      ) {
        return { error: "このクエリは実行できません" };
      }

      const results = await executeQuery(sql);
      return {
        description,
        rowCount: results.length,
        data: results.slice(0, 100), // 最大100行
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "クエリエラー" };
    }
  },
});

// KPI 取得ツール
export const getKPIsTool = tool({
  description:
    "日別のKPI（セッション数、ユーザー数、購入数、売上）を取得します",
  parameters: z.object({
    days: z.number().min(1).max(365).describe("取得する日数"),
  }),
  execute: async ({ days }) => {
    const kpis = await getKPIs(days);
    return { data: kpis };
  },
});

// 売上トップ商品ツール
export const getTopProductsTool = tool({
  description: "売上上位の商品を取得します",
  parameters: z.object({
    days: z.number().min(1).max(365).describe("集計期間（日数）"),
    limit: z.number().min(1).max(50).describe("取得件数"),
  }),
  execute: async ({ days, limit }) => {
    const products = await getTopProducts(days, limit);
    return { data: products };
  },
});

// 比較分析ツール
export const comparePeriodsTools = tool({
  description: "2つの期間のメトリクスを比較します",
  parameters: z.object({
    metric: z.enum(["revenue", "users", "sessions", "purchases"]),
    currentDays: z.number().describe("現在の期間（日数）"),
    previousDays: z.number().describe("比較する過去の期間（日数）"),
  }),
  execute: async ({ metric, currentDays, previousDays }) => {
    const metricColumn =
      metric === "revenue"
        ? "SUM(CAST(JSON_VALUE(properties, '$.amount') AS NUMERIC))"
        : metric === "users"
          ? "COUNT(DISTINCT user_id)"
          : metric === "sessions"
            ? "COUNT(DISTINCT session_id)"
            : "COUNT(*)";

    const query = `
      WITH current_period AS (
        SELECT ${metricColumn} as value
        FROM analytics.events
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @currentDays DAY)
      ),
      previous_period AS (
        SELECT ${metricColumn} as value
        FROM analytics.events
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @totalDays DAY)
          AND timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @currentDays DAY)
      )
      SELECT
        c.value as current_value,
        p.value as previous_value,
        SAFE_DIVIDE(c.value - p.value, p.value) * 100 as change_percent
      FROM current_period c, previous_period p
    `;

    const results = await executeQuery(query, {
      currentDays,
      totalDays: currentDays + previousDays,
    });

    return { data: results[0] };
  },
});

// すべてのツールをエクスポート
export const analyticsTools = {
  executeSQL: executeSQLTool,
  getKPIs: getKPIsTool,
  getTopProducts: getTopProductsTool,
  comparePeriods: comparePeriodsTools,
};
```

## システムプロンプト

```typescript
// lib/ai/prompts.ts
export const analyticsSystemPrompt = `あなたはデータ分析の専門家AIアシスタントです。

## 役割
- ユーザーのビジネス質問に対して、データに基づいた回答を提供します
- 必要に応じてSQLクエリを実行してデータを取得します
- 分析結果を分かりやすく解釈し、インサイトを提供します

## 利用可能なデータ
- events: ユーザーイベント（ページビュー、クリック、購入等）
- sales: 売上データ（商品、金額、数量）
- daily_kpis: 日別KPI集計

## 回答のガイドライン
1. まず質問の意図を理解し、必要なデータを特定する
2. 適切なツールを使ってデータを取得する
3. データを分析し、インサイトを導き出す
4. 結果を簡潔に要約し、具体的な数値を含める
5. 可能であれば、アクションの提案も行う

## 出力フォーマット
- 主要な発見事項を箇条書きで示す
- 重要な数値は強調する
- グラフ表示が有効な場合は、データを構造化して返す

## 注意事項
- 推測ではなく、データに基づいた回答を心がける
- 不確実な場合は、その旨を明示する
- 個人情報やセンシティブなデータには注意する`;
```

## AI 分析 API

```typescript
// app/api/ai/analyze/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { analyticsTools } from "@/lib/ai/tools";
import { analyticsSystemPrompt } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: analyticsSystemPrompt,
    tools: analyticsTools,
    maxSteps: 5, // 複数回のツール呼び出しを許可
    messages,
  });

  return result.toDataStreamResponse();
}
```

## 非ストリーミング分析

```typescript
// app/api/ai/analyze-sync/route.ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { analyticsTools } from "@/lib/ai/tools";
import { analyticsSystemPrompt } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  const { question } = await req.json();

  const result = await generateText({
    model: openai("gpt-4o"),
    system: analyticsSystemPrompt,
    tools: analyticsTools,
    maxSteps: 5,
    prompt: question,
  });

  return Response.json({
    answer: result.text,
    toolCalls: result.toolCalls,
    toolResults: result.toolResults,
  });
}
```

## 構造化分析出力

```typescript
// app/api/ai/insights/route.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getKPIs, getTopProducts } from "@/lib/analytics/queries";

const insightSchema = z.object({
  summary: z.string().describe("分析の要約（2-3文）"),
  keyFindings: z
    .array(
      z.object({
        title: z.string(),
        value: z.string(),
        trend: z.enum(["up", "down", "stable"]),
        importance: z.enum(["high", "medium", "low"]),
      }),
    )
    .describe("主要な発見事項"),
  recommendations: z.array(z.string()).describe("推奨アクション"),
  chartData: z
    .object({
      type: z.enum(["line", "bar", "pie"]),
      title: z.string(),
      data: z.array(z.record(z.unknown())),
    })
    .optional()
    .describe("可視化用データ"),
});

export async function POST(req: Request) {
  const { days = 7 } = await req.json();

  // データ取得
  const [kpis, topProducts] = await Promise.all([
    getKPIs(days),
    getTopProducts(days, 10),
  ]);

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: insightSchema,
    prompt: `以下のデータを分析し、ビジネスインサイトを生成してください。

## KPIデータ（過去${days}日間）
${JSON.stringify(kpis, null, 2)}

## 売上トップ10商品
${JSON.stringify(topProducts, null, 2)}

分析ポイント:
1. 売上トレンド
2. コンバージョン率の変化
3. 商品カテゴリの傾向
4. 改善の機会`,
  });

  return Response.json(result.object);
}
```

## クライアント側の使用

```typescript
// hooks/useAIAnalysis.ts
import { useChat } from "ai/react";

export function useAIAnalysis() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai/analyze",
      onFinish: (message) => {
        console.log("Analysis complete:", message);
      },
    });

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  };
}
```

```typescript
// 構造化インサイト取得
export function useInsights(days: number = 7) {
  return useQuery({
    queryKey: ["insights", days],
    queryFn: async () => {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5分
  });
}
```

## 次のステップ

次章では、自然言語クエリの実装について学びます。

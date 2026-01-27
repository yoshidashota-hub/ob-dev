# 第7章: ベストプラクティス

## アーキテクチャ設計

### レイヤー分離

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API エンドポイント
│   │   ├── ai/            # AI 関連
│   │   ├── analytics/     # データ分析
│   │   └── reports/       # レポート
│   └── (pages)/           # UI ページ
├── components/            # React コンポーネント
│   ├── dashboard/
│   ├── chat/
│   └── reports/
├── lib/                   # ビジネスロジック
│   ├── ai/                # AI SDK ラッパー
│   │   ├── client.ts
│   │   ├── tools.ts
│   │   └── prompts.ts
│   ├── analytics/         # データ分析
│   │   ├── bigquery.ts
│   │   ├── elasticsearch.ts
│   │   └── queries/
│   └── utils/
├── hooks/                 # カスタムフック
└── types/                 # 型定義
```

### 依存関係の方向

```
UI Components
     ↓
Hooks (useChat, useAnalytics)
     ↓
API Routes
     ↓
Services (AI, Analytics)
     ↓
Data Layer (BigQuery, ES)
```

## AI の活用パターン

### ツール設計の原則

```typescript
// ✅ 良いツール設計
export const analyzeDataTool = tool({
  // 明確な説明
  description: "指定された期間の売上データを分析し、トレンドを報告します",
  // 具体的なパラメータ
  parameters: z.object({
    metric: z.enum(["revenue", "users", "sessions"]),
    days: z.number().min(1).max(365),
    groupBy: z.enum(["day", "week", "month"]).optional(),
  }),
  // 構造化された出力
  execute: async (params) => {
    const data = await fetchData(params);
    return {
      summary: "...",
      data: data.slice(0, 100),
      metadata: { totalRows: data.length },
    };
  },
});

// ❌ 悪いツール設計
export const badTool = tool({
  description: "データを取得", // 曖昧
  parameters: z.object({
    query: z.string(), // 自由形式は危険
  }),
  execute: async ({ query }) => {
    return await executeRawQuery(query); // 制限なし
  },
});
```

### プロンプト管理

```typescript
// lib/ai/prompts.ts
export const prompts = {
  analytics: {
    system: `あなたはデータ分析の専門家です。
以下のガイドラインに従ってください:
1. データに基づいた回答のみを提供
2. 不確実な場合は明示する
3. 具体的な数値を含める
4. アクション可能な提案を心がける`,

    analyze: (context: string) => `
以下のデータを分析してください:
${context}

分析のポイント:
- トレンドの特定
- 異常値の検出
- 改善の機会`,
  },

  report: {
    daily: (data: string) => `
以下のデータから日次レポートを生成:
${data}`,
  },
};
```

### エラーハンドリング

```typescript
// lib/ai/error-handler.ts
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

export async function withAIErrorHandling<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      // レート制限
      if (error.message.includes("rate_limit")) {
        throw new AIError("レート制限に達しました", "RATE_LIMIT", true);
      }
      // コンテキスト長超過
      if (error.message.includes("context_length")) {
        throw new AIError("データが大きすぎます", "CONTEXT_LENGTH", false);
      }
    }

    if (fallback !== undefined) {
      console.error("AI operation failed, using fallback:", error);
      return fallback;
    }

    throw error;
  }
}
```

## データ分析の最適化

### クエリキャッシュ

```typescript
// lib/analytics/cache.ts
import { LRUCache } from "lru-cache";

const queryCache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5分
});

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = queryCache.get(key);
  if (cached) return cached as T;

  const result = await queryFn();
  queryCache.set(key, result, { ttl });
  return result;
}

// 使用例
export async function getKPIsCached(days: number) {
  return cachedQuery(`kpis:${days}`, () => getKPIs(days), 60000);
}
```

### コスト管理

```typescript
// lib/analytics/cost-guard.ts
const MAX_BYTES_PER_QUERY = 10 * 1024 * 1024 * 1024; // 10GB
const MAX_DAILY_COST = 10; // $10

let dailyCost = 0;
let lastReset = Date.now();

export async function executeWithCostGuard(
  query: string
): Promise<any[]> {
  // 日次リセット
  if (Date.now() - lastReset > 24 * 60 * 60 * 1000) {
    dailyCost = 0;
    lastReset = Date.now();
  }

  // ドライラン
  const [dryRunJob] = await bigquery.createQueryJob({
    query,
    dryRun: true,
  });

  const bytesProcessed = parseInt(
    dryRunJob.metadata.statistics.totalBytesProcessed
  );
  const estimatedCost = (bytesProcessed / 1e12) * 5;

  // コストチェック
  if (bytesProcessed > MAX_BYTES_PER_QUERY) {
    throw new Error(`クエリが大きすぎます: ${(bytesProcessed / 1e9).toFixed(2)}GB`);
  }

  if (dailyCost + estimatedCost > MAX_DAILY_COST) {
    throw new Error("日次コスト上限に達しました");
  }

  // 実行
  const [rows] = await bigquery.query({ query });
  dailyCost += estimatedCost;

  return rows;
}
```

## フロントエンド最適化

### データフェッチング

```typescript
// hooks/useAnalytics.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";

// プリフェッチ
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ダッシュボードデータを事前取得
    queryClient.prefetchQuery({
      queryKey: ["kpis", 7],
      queryFn: () => fetchKPIs(7),
    });
    queryClient.prefetchQuery({
      queryKey: ["topProducts", 7],
      queryFn: () => fetchTopProducts(7),
    });
  }, [queryClient]);
}

// 楽観的更新
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const updateKPI = useMutation({
    mutationFn: updateKPIData,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["kpis"] });
      const previous = queryClient.getQueryData(["kpis"]);
      queryClient.setQueryData(["kpis"], (old) => ({ ...old, ...newData }));
      return { previous };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(["kpis"], context?.previous);
    },
  });

  return updateKPI;
}
```

### コンポーネント最適化

```typescript
// components/dashboard/Chart.tsx
import { memo, useMemo } from "react";
import { LineChart } from "recharts";

interface ChartProps {
  data: any[];
  metric: string;
}

// メモ化
export const Chart = memo(function Chart({ data, metric }: ChartProps) {
  // 計算結果のキャッシュ
  const processedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      formattedValue: formatValue(item[metric]),
    }));
  }, [data, metric]);

  return <LineChart data={processedData} />;
});

// 比較関数
function areEqual(prevProps: ChartProps, nextProps: ChartProps) {
  return (
    prevProps.metric === nextProps.metric &&
    prevProps.data.length === nextProps.data.length &&
    prevProps.data[0]?.date === nextProps.data[0]?.date
  );
}
```

## セキュリティ

### AI の入力検証

```typescript
// lib/ai/validation.ts
const FORBIDDEN_PATTERNS = [
  /DROP\s+TABLE/i,
  /DELETE\s+FROM/i,
  /UPDATE\s+.*SET/i,
  /INSERT\s+INTO/i,
  /TRUNCATE/i,
];

export function validateAIQuery(query: string): boolean {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(query)) {
      return false;
    }
  }
  return true;
}

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // XSS 防止
    .slice(0, 1000); // 長さ制限
}
```

### API レート制限

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1m"), // 1分に10リクエスト
});

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/ai")) {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  return NextResponse.next();
}
```

## 監視とログ

```typescript
// lib/monitoring.ts
interface AnalyticsEvent {
  type: "ai_query" | "data_fetch" | "report_generated";
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export function logAnalyticsEvent(event: AnalyticsEvent): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event,
  }));

  // 本番環境では外部サービスに送信
  if (process.env.NODE_ENV === "production") {
    // DataDog, CloudWatch など
  }
}

// 使用例
export async function withMonitoring<T>(
  type: AnalyticsEvent["type"],
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    logAnalyticsEvent({
      type,
      duration: Date.now() - start,
      success: true,
    });
    return result;
  } catch (error) {
    logAnalyticsEvent({
      type,
      duration: Date.now() - start,
      success: false,
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
    });
    throw error;
  }
}
```

## チェックリスト

```
□ AI ツールは明確な説明と制限を持つ
□ プロンプトは外部ファイルで管理
□ クエリにコスト制限を設定
□ データはキャッシュを活用
□ フロントエンドはメモ化を活用
□ 入力検証とサニタイズを実施
□ レート制限を設定
□ 監視とログを実装
□ エラーハンドリングを実装
```

## 参考リンク

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [BigQuery Best Practices](https://cloud.google.com/bigquery/docs/best-practices)
- [TanStack Query](https://tanstack.com/query)
- [Recharts](https://recharts.org/)

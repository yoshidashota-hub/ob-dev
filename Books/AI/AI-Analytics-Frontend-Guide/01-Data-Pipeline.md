# 第1章: データパイプライン

## データ収集アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│              Data Collection Pipeline                │
│                                                     │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐      │
│  │ Client  │ ──▶ │  API    │ ──▶ │ Buffer  │      │
│  │ Events  │     │ /events │     │ (Queue) │      │
│  └─────────┘     └─────────┘     └────┬────┘      │
│                                       │            │
│                         ┌─────────────┼────────────┤
│                         ▼             ▼            │
│                  ┌─────────┐   ┌─────────┐        │
│                  │BigQuery │   │   ES    │        │
│                  │(分析用) │   │(検索用) │        │
│                  └─────────┘   └─────────┘        │
└─────────────────────────────────────────────────────┘
```

## イベント収集

### クライアント側

```typescript
// lib/analytics/tracker.ts
interface TrackEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

class AnalyticsTracker {
  private buffer: TrackEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushInterval();
  }

  track(event: TrackEvent): void {
    this.buffer.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    if (this.buffer.length >= 10) {
      this.flush();
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, 5000);
  }

  private async flush(): Promise<void> {
    const events = [...this.buffer];
    this.buffer = [];

    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // 失敗した場合はバッファに戻す
      this.buffer.unshift(...events);
    }
  }
}

export const tracker = new AnalyticsTracker();

// 使用例
tracker.track({
  name: "page_view",
  properties: { page: "/dashboard" },
});

tracker.track({
  name: "button_click",
  properties: { button: "export_report" },
});
```

### サーバー側

```typescript
// app/api/events/route.ts
import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import { randomUUID } from "crypto";

const bigquery = new BigQuery();

interface Event {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export async function POST(req: Request) {
  try {
    const { events } = (await req.json()) as { events: Event[] };

    const rows = events.map((event) => ({
      id: randomUUID(),
      event_name: event.name,
      user_id: event.userId || null,
      session_id: event.sessionId || null,
      properties: event.properties ? JSON.stringify(event.properties) : null,
      timestamp: event.timestamp,
      created_at: new Date().toISOString(),
    }));

    await bigquery.dataset("analytics").table("events").insert(rows);

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error("Event ingestion error:", error);
    return NextResponse.json(
      { error: "Failed to ingest events" },
      { status: 500 },
    );
  }
}
```

## BigQuery スキーマ

```sql
-- イベントテーブル
CREATE TABLE analytics.events (
  id STRING NOT NULL,
  event_name STRING NOT NULL,
  user_id STRING,
  session_id STRING,
  properties JSON,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_name, user_id;

-- 売上テーブル
CREATE TABLE analytics.sales (
  id STRING NOT NULL,
  order_id STRING NOT NULL,
  product_id STRING NOT NULL,
  product_name STRING,
  category STRING,
  quantity INT64,
  unit_price NUMERIC,
  total_amount NUMERIC,
  user_id STRING,
  timestamp TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY category, product_id;

-- KPI 集計テーブル（マテリアライズドビュー）
CREATE MATERIALIZED VIEW analytics.daily_kpis AS
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END) as sessions,
  COUNT(DISTINCT user_id) as users,
  COUNT(CASE WHEN event_name = 'purchase' THEN 1 END) as purchases,
  SUM(CAST(JSON_VALUE(properties, '$.amount') AS NUMERIC)) as revenue
FROM analytics.events
GROUP BY date;
```

## クエリサービス

```typescript
// lib/analytics/queries.ts
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

// KPI 取得
export async function getKPIs(days: number = 7) {
  const query = `
    SELECT
      date,
      sessions,
      users,
      purchases,
      revenue,
      SAFE_DIVIDE(purchases, sessions) as conversion_rate
    FROM analytics.daily_kpis
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
    ORDER BY date DESC
  `;

  const [rows] = await bigquery.query({ query, params: { days } });
  return rows;
}

// 売上トップ商品
export async function getTopProducts(days: number = 7, limit: number = 10) {
  const query = `
    SELECT
      product_id,
      product_name,
      category,
      SUM(quantity) as total_quantity,
      SUM(total_amount) as total_revenue
    FROM analytics.sales
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
    GROUP BY product_id, product_name, category
    ORDER BY total_revenue DESC
    LIMIT @limit
  `;

  const [rows] = await bigquery.query({ query, params: { days, limit } });
  return rows;
}

// 時系列データ
export async function getTimeSeries(
  metric: "revenue" | "users" | "sessions",
  days: number = 30,
  granularity: "hour" | "day" | "week" = "day",
) {
  const dateFormat =
    granularity === "hour"
      ? "TIMESTAMP_TRUNC(timestamp, HOUR)"
      : granularity === "week"
        ? "DATE_TRUNC(DATE(timestamp), WEEK)"
        : "DATE(timestamp)";

  const metricExpr =
    metric === "revenue"
      ? "SUM(CAST(JSON_VALUE(properties, '$.amount') AS NUMERIC))"
      : metric === "users"
        ? "COUNT(DISTINCT user_id)"
        : "COUNT(DISTINCT session_id)";

  const query = `
    SELECT
      ${dateFormat} as period,
      ${metricExpr} as value
    FROM analytics.events
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
    GROUP BY period
    ORDER BY period
  `;

  const [rows] = await bigquery.query({ query, params: { days } });
  return rows;
}

// カスタムクエリ実行
export async function executeQuery(sql: string, params?: Record<string, any>) {
  const [rows] = await bigquery.query({ query: sql, params });
  return rows;
}
```

## API エンドポイント

```typescript
// app/api/analytics/kpis/route.ts
import { NextResponse } from "next/server";
import { getKPIs } from "@/lib/analytics/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");

  try {
    const kpis = await getKPIs(days);
    return NextResponse.json({ data: kpis });
  } catch (error) {
    console.error("KPI fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 },
    );
  }
}
```

```typescript
// app/api/analytics/timeseries/route.ts
import { NextResponse } from "next/server";
import { getTimeSeries } from "@/lib/analytics/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") as "revenue" | "users" | "sessions";
  const days = parseInt(searchParams.get("days") || "30");
  const granularity = searchParams.get("granularity") as
    | "hour"
    | "day"
    | "week";

  try {
    const data = await getTimeSeries(metric, days, granularity);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Timeseries fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeseries" },
      { status: 500 },
    );
  }
}
```

## React Query フック

```typescript
// hooks/useAnalytics.ts
import { useQuery } from "@tanstack/react-query";

interface KPI {
  date: string;
  sessions: number;
  users: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
}

export function useKPIs(days: number = 7) {
  return useQuery<KPI[]>({
    queryKey: ["kpis", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/kpis?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      const { data } = await res.json();
      return data;
    },
    staleTime: 60 * 1000, // 1分
  });
}

export function useTimeSeries(
  metric: "revenue" | "users" | "sessions",
  days: number = 30,
  granularity: "hour" | "day" | "week" = "day",
) {
  return useQuery({
    queryKey: ["timeseries", metric, days, granularity],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/timeseries?metric=${metric}&days=${days}&granularity=${granularity}`,
      );
      if (!res.ok) throw new Error("Failed to fetch timeseries");
      const { data } = await res.json();
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useTopProducts(days: number = 7, limit: number = 10) {
  return useQuery({
    queryKey: ["topProducts", days, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/top-products?days=${days}&limit=${limit}`,
      );
      if (!res.ok) throw new Error("Failed to fetch top products");
      const { data } = await res.json();
      return data;
    },
    staleTime: 60 * 1000,
  });
}
```

## 次のステップ

次章では、AI 分析エンジンの構築について学びます。
